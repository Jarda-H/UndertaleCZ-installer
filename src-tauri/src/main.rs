// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn steam_is_installed() -> Result<String, String> {
    let mut key = winreg::RegKey::predef(winreg::enums::HKEY_LOCAL_MACHINE);
    let mut subkey = key
        .open_subkey("SOFTWARE\\Wow6432Node\\Valve\\Steam")
        .unwrap();
    let mut value: String = subkey.get_value("InstallPath").unwrap();
    if value.is_empty() {
        //try 32 bit
        key = winreg::RegKey::predef(winreg::enums::HKEY_LOCAL_MACHINE);
        subkey = key.open_subkey("SOFTWARE\\Valve\\Steam").unwrap();
        value = subkey.get_value("InstallPath").unwrap();
    }
    if value.is_empty() {
        return Err("Steam nebyl nalezen".into());
    }
    //println!("Steam is installed at: {}", value);
    Ok(value.into())
}
#[tauri::command]
fn get_file_status(path: &str) -> Result<String, String> {
    let metadata = std::fs::metadata(path);
    match metadata {
        Ok(_) => Ok("exist".into()),
        Err(_) => Err("not exist".into()),
    }
}
#[tauri::command]
fn get_file_content(path: &str) -> Result<String, String> {
    let content = std::fs::read_to_string(path);
    match content {
        Ok(content) => Ok(content),
        Err(_) => Err("error".into()),
    }
}
#[tauri::command]
fn check_md5_hash_of_file(path: &str) -> Result<String, String> {
    let content = std::fs::read(path);
    match content {
        Ok(content) => {
            let hash = md5::compute(content);
            //return the hash as string
            Ok(format!("{:x}", hash))
        }
        Err(_) => Err("error".into()),
    }
}
#[tauri::command]
//get current path and return it
fn get_current_path() -> String {
    std::env::current_dir()
        .unwrap()
        .to_str()
        .unwrap()
        .to_string()
}
#[tauri::command]
fn rename_file(old_path: &str, new_path: &str) -> Result<String, String> {
    let result = std::fs::rename(old_path, new_path);
    match result {
        Ok(_) => Ok("ok".into()),
        Err(_) => Err("error".into()),
    }
}
#[tauri::command]
fn remove_file(path: &str) -> Result<String, String> {
    let result = std::fs::remove_file(path);
    match result {
        Ok(_) => Ok("ok".into()),
        Err(_) => Err("error".into()),
    }
}
fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            steam_is_installed,
            get_file_status,
            get_file_content,
            check_md5_hash_of_file,
            get_current_path,
            rename_file,
            remove_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
