use serde::{Deserialize, Serialize};
use crate::error::{AppError, AppResult};

#[derive(Debug, Serialize, Deserialize)]
pub struct OAuthTokenResponse {
    pub access_token: String,
    pub expires_in: u64,
    pub refresh_token: Option<String>,
    pub scope: Option<String>,
    pub token_type: String,
}

pub struct GmailOAuthService {
    client_id: String,
    client_secret: String,
}

impl GmailOAuthService {
    pub fn new(client_id: String, client_secret: String) -> Self {
        Self {
            client_id,
            client_secret,
        }
    }

    /// Generate authorization URL for the user's system browser
    pub fn get_auth_url(&self, redirect_port: u16) -> String {
        let redirect_uri = format!("http://127.0.0.1:{}", redirect_port);
        let scope = "https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly";
        format!(
            "https://accounts.google.com/o/oauth2/v2/auth?\
            client_id={}&\
            redirect_uri={}&\
            response_type=code&\
            scope={}&\
            access_type=offline&\
            prompt=consent",
            urlencoding(&self.client_id),
            urlencoding(&redirect_uri),
            urlencoding(scope)
        )
    }

    /// Bind to a free loopback port (tries preferred ports, then any free port)
    pub async fn bind_listener() -> AppResult<(tokio::net::TcpListener, u16)> {
        for p in [8080, 8081, 8088, 8888, 9090] {
            if let Ok(l) = tokio::net::TcpListener::bind(format!("127.0.0.1:{}", p)).await {
                return Ok((l, p));
            }
        }
        let l = tokio::net::TcpListener::bind("127.0.0.1:0").await
            .map_err(|e| AppError::Auth(format!("Failed to bind loopback OAuth listener: {}", e)))?;
        let p = l.local_addr().map_err(|e| AppError::Auth(e.to_string()))?.port();
        Ok((l, p))
    }

    /// Wait for the redirect on local loopback TCP listener and return authorization code
    pub async fn wait_for_authorization_code(listener: tokio::net::TcpListener) -> AppResult<String> {
        use tokio::io::{AsyncReadExt, AsyncWriteExt};

        loop {
            let (mut stream, _) = listener.accept().await
                .map_err(|e| AppError::Auth(format!("OAuth listener error: {}", e)))?;

            let mut buffer = [0; 4096];
            let bytes_read = stream.read(&mut buffer).await
                .map_err(|e| AppError::Auth(format!("Failed to read OAuth request: {}", e)))?;

            let request = String::from_utf8_lossy(&buffer[..bytes_read]);

            // If it's a request for favicon, return 404 and continue waiting for callback
            if request.contains("GET /favicon.ico") {
                let _ = stream.write_all(b"HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\n\r\n").await;
                continue;
            }

            // Check if there's an error from Google (e.g., access_denied)
            if let Some(error) = extract_query_param(&request, "error") {
                let err_page = format!(
                    "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n\
                    <!DOCTYPE html><html><body style='font-family: -apple-system, sans-serif; background: #090A0C; color: #EDEDED; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;'>\
                    <div style='text-align: center; border: 1px solid rgba(255,255,255,0.1); padding: 40px; border-radius: 12px; background: #121316;'>\
                    <h2 style='margin-bottom: 8px; color: #EF4444;'>Authentication Failed</h2>\
                    <p style='color: #8A8F98;'>Error: {}</p>\
                    </div></body></html>",
                    error
                );
                let _ = stream.write_all(err_page.as_bytes()).await;
                let _ = stream.flush().await;
                return Err(AppError::Auth(format!("Google OAuth authorization denied: {}", error)));
            }

            // Parse query parameter `code=`
            if let Some(code) = extract_query_param(&request, "code") {
                let html_response = "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n\
                    <!DOCTYPE html><html><body style='font-family: -apple-system, sans-serif; background: #090A0C; color: #EDEDED; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;'>\
                    <div style='text-align: center; border: 1px solid rgba(255,255,255,0.1); padding: 40px; border-radius: 12px; background: #121316;'>\
                    <h2 style='margin-bottom: 8px; color: #10B981;'>Authentication Successful</h2>\
                    <p style='color: #8A8F98;'>You can now close this tab and return to Zmail.</p>\
                    </div></body></html>";

                let _ = stream.write_all(html_response.as_bytes()).await;
                let _ = stream.flush().await;

                return Ok(code);
            }

            // Any other unrecognized request
            let _ = stream.write_all(b"HTTP/1.1 204 No Content\r\n\r\n").await;
        }
    }

    /// Exchange authorization code for access and refresh tokens
    pub async fn exchange_code(&self, code: &str, redirect_port: u16) -> AppResult<OAuthTokenResponse> {
        let redirect_uri = format!("http://127.0.0.1:{}", redirect_port);
        let client = reqwest::Client::new();

        let params = [
            ("code", code),
            ("client_id", &self.client_id),
            ("client_secret", &self.client_secret),
            ("redirect_uri", &redirect_uri),
            ("grant_type", "authorization_code"),
        ];

        let response = client
            .post("https://oauth2.googleapis.com/token")
            .form(&params)
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(AppError::Auth(format!("Google OAuth token exchange failed: {}", error_text)));
        }

        let tokens = response.json::<OAuthTokenResponse>().await?;
        Ok(tokens)
    }

    /// Refresh expired access token using permanent refresh token
    pub async fn refresh_access_token(&self, refresh_token: &str) -> AppResult<OAuthTokenResponse> {
        let client = reqwest::Client::new();

        let params = [
            ("client_id", self.client_id.as_str()),
            ("client_secret", self.client_secret.as_str()),
            ("refresh_token", refresh_token),
            ("grant_type", "refresh_token"),
        ];

        let response = client
            .post("https://oauth2.googleapis.com/token")
            .form(&params)
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(AppError::Auth(format!("Failed to refresh OAuth token: {}", error_text)));
        }

        let tokens = response.json::<OAuthTokenResponse>().await?;
        Ok(tokens)
    }

    /// Fetch user email address from Google profile
    pub async fn fetch_user_email(&self, access_token: &str) -> AppResult<String> {
        let client = reqwest::Client::new();
        let res = client
            .get("https://gmail.googleapis.com/gmail/v1/users/me/profile")
            .bearer_auth(access_token)
            .send()
            .await?;

        if !res.status().is_success() {
            let err = res.text().await.unwrap_or_default();
            return Err(AppError::Auth(format!("Failed to fetch Gmail profile: {}", err)));
        }

        let body: serde_json::Value = res.json().await?;
        let email = body["emailAddress"]
            .as_str()
            .ok_or_else(|| AppError::Auth("Missing emailAddress in profile".to_string()))?;

        Ok(email.to_string())
    }
}

fn urlencoding(input: &str) -> String {
    url::form_urlencoded::byte_serialize(input.as_bytes()).collect()
}

pub(crate) fn extract_query_param(request: &str, param: &str) -> Option<String> {
    let first_line = request.lines().next()?;
    let path = first_line.split_whitespace().nth(1)?;
    let query_start = path.find('?')?;
    let query = &path[query_start + 1..];

    for (k, v) in url::form_urlencoded::parse(query.as_bytes()) {
        if k == param && !v.is_empty() {
            return Some(v.into_owned());
        }
    }
    None
}
