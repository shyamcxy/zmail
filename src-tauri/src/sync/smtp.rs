use lettre::message::header::ContentType;
use lettre::transport::smtp::authentication::Credentials;
use lettre::{Message as LettreMessage, SmtpTransport, Transport};
use crate::error::{AppError, AppResult};
use crate::models::SendEmailRequest;

pub struct SmtpService;

impl Default for SmtpService {
    fn default() -> Self {
        Self::new()
    }
}

impl SmtpService {
    pub fn new() -> Self {
        Self
    }

    /// Send email via SMTP server
    pub fn send(
        &self,
        smtp_host: &str,
        smtp_port: u16,
        username: &str,
        password: &str,
        from_address: &str,
        req: &SendEmailRequest,
    ) -> AppResult<()> {
        let mut builder = LettreMessage::builder()
            .from(from_address.parse().map_err(|e| AppError::Validation(format!("Invalid from address: {}", e)))?)
            .subject(&req.subject);

        for to in &req.to {
            builder = builder.to(to.parse().map_err(|e| AppError::Validation(format!("Invalid to address: {}", e)))?);
        }

        if let Some(ccs) = &req.cc {
            for cc in ccs {
                builder = builder.cc(cc.parse().map_err(|e| AppError::Validation(format!("Invalid cc address: {}", e)))?);
            }
        }

        let email = if let Some(html) = &req.body_html {
            builder
                .header(ContentType::TEXT_HTML)
                .body(html.clone())
                .map_err(|e| AppError::Internal(format!("Failed to build HTML email: {}", e)))?
        } else {
            builder
                .header(ContentType::TEXT_PLAIN)
                .body(req.body_text.clone())
                .map_err(|e| AppError::Internal(format!("Failed to build text email: {}", e)))?
        };

        let creds = Credentials::new(username.to_string(), password.to_string());

        let mailer = SmtpTransport::relay(smtp_host)
            .map_err(|e| AppError::Network(format!("SMTP relay error: {}", e)))?
            .port(smtp_port)
            .credentials(creds)
            .build();

        mailer.send(&email).map_err(|e| AppError::Network(format!("Failed to send email via SMTP: {}", e)))?;

        Ok(())
    }
}
