pub mod schema;
pub mod queries;

use std::path::Path;
use rusqlite::Connection;
use crate::error::AppResult;

pub struct DatabaseManager {
    db_path: String,
}

impl DatabaseManager {
    pub fn new<P: AsRef<Path>>(path: P) -> Self {
        Self {
            db_path: path.as_ref().to_string_lossy().to_string(),
        }
    }

    pub fn get_connection(&self) -> AppResult<Connection> {
        let conn = Connection::open(&self.db_path)?;
        schema::initialize_database(&conn)?;
        Ok(conn)
    }
}
