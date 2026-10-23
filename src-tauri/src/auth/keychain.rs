use std::collections::HashMap;
use std::sync::RwLock;
use crate::error::{AppError, AppResult};

pub struct KeychainService {
    cache: RwLock<HashMap<(String, String), String>>,
}

impl Default for KeychainService {
    fn default() -> Self {
        Self::new()
    }
}

impl KeychainService {
    pub fn new() -> Self {
        Self {
            cache: RwLock::new(HashMap::new()),
        }
    }

    #[cfg(target_os = "macos")]
    pub fn set_secret(&self, service: &str, account: &str, secret: &str) -> AppResult<()> {
        use security_framework::passwords::set_generic_password;
        set_generic_password(service, account, secret.as_bytes())
            .map_err(|e| AppError::Auth(format!("Failed to store secret in Keychain: {}", e)))?;
        
        if let Ok(mut cache) = self.cache.write() {
            cache.insert((service.to_string(), account.to_string()), secret.to_string());
        }
        Ok(())
    }

    #[cfg(not(target_os = "macos"))]
    pub fn set_secret(&self, service: &str, account: &str, secret: &str) -> AppResult<()> {
        if let Ok(mut cache) = self.cache.write() {
            cache.insert((service.to_string(), account.to_string()), secret.to_string());
        }
        Ok(())
    }

    #[cfg(target_os = "macos")]
    pub fn get_secret(&self, service: &str, account: &str) -> AppResult<Option<String>> {
        // Fast in-memory cache check to prevent repeated macOS Keychain ACL prompts
        if let Ok(cache) = self.cache.read() {
            if let Some(val) = cache.get(&(service.to_string(), account.to_string())) {
                return Ok(Some(val.clone()));
            }
        }

        use security_framework::passwords::get_generic_password;
        match get_generic_password(service, account) {
            Ok(bytes) => {
                let s = String::from_utf8(bytes)
                    .map_err(|e| AppError::Auth(format!("Corrupt secret in Keychain: {}", e)))?;
                if let Ok(mut cache) = self.cache.write() {
                    cache.insert((service.to_string(), account.to_string()), s.clone());
                }
                Ok(Some(s))
            }
            Err(e) => {
                // If item not found, return None rather than error
                if e.code() == -25300 { // errSecItemNotFound
                    Ok(None)
                } else {
                    Err(AppError::Auth(format!("Keychain lookup error: {}", e)))
                }
            }
        }
    }

    #[cfg(not(target_os = "macos"))]
    pub fn get_secret(&self, service: &str, account: &str) -> AppResult<Option<String>> {
        if let Ok(cache) = self.cache.read() {
            if let Some(val) = cache.get(&(service.to_string(), account.to_string())) {
                return Ok(Some(val.clone()));
            }
        }
        Ok(None)
    }

    #[cfg(target_os = "macos")]
    pub fn delete_secret(&self, service: &str, account: &str) -> AppResult<()> {
        use security_framework::passwords::set_generic_password;
        let _ = set_generic_password(service, account, b"");
        if let Ok(mut cache) = self.cache.write() {
            cache.remove(&(service.to_string(), account.to_string()));
        }
        Ok(())
    }

    #[cfg(not(target_os = "macos"))]
    pub fn delete_secret(&self, service: &str, account: &str) -> AppResult<()> {
        if let Ok(mut cache) = self.cache.write() {
            cache.remove(&(service.to_string(), account.to_string()));
        }
        Ok(())
    }
}
