use std::sync::Arc;
use crate::ai::OllamaClient;
use crate::auth::KeychainService;
use crate::db::DatabaseManager;
use crate::sync::{GmailSyncEngine, SmtpService};
use crate::unsubscribe::UnsubscribeService;

pub struct AppState {
    pub db: DatabaseManager,
    pub keychain: KeychainService,
    pub ollama: OllamaClient,
    pub gmail_sync: GmailSyncEngine,
    pub unsubscribe: UnsubscribeService,
    pub smtp: SmtpService,
}

impl AppState {
    pub fn new(db_path: &str) -> Self {
        Self {
            db: DatabaseManager::new(db_path),
            keychain: KeychainService::new(),
            ollama: OllamaClient::new(None, None),
            gmail_sync: GmailSyncEngine::new(),
            unsubscribe: UnsubscribeService::new(),
            smtp: SmtpService::new(),
        }
    }
}

pub type SharedAppState = Arc<AppState>;
