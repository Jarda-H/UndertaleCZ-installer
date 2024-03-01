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
#[tauri::command]
fn create_sha256_hash_from_timestamp_with_salt(timestamp: &str) -> Result<String, String> {
    use dotenv_codegen::dotenv;
    use sha2::Digest;
    let mut hasher = sha2::Sha256::new();
    hasher.update(timestamp);
    //get salt from .env file
    let salt = dotenv!("SALT");
    hasher.update(salt);
    let result = hasher.finalize();
    Ok(format!("{:x}", result))
}
#[tauri::command]
fn run_xdelta3(
    source: &str,
    patch: &str,
    output: &str,
    offline: bool,
    steam: bool,
) -> Result<String, String> {
    use std::process::Command;
    use std::os::windows::process::CommandExt;
    let no_win: u32 = 0x08000000;
    let xdelta3 = include_bytes!("../binaries/xdelta3-x86_64-pc-windows-msvc.exe");
    let mut temp_path = std::env::temp_dir();
    temp_path.push("xdelta3.exe");
    std::fs::write(temp_path.clone(), xdelta3).expect("Unable to write file");
    let mut patch_path = patch.to_string();
    if offline {
        let patch_bytes;
        if steam {
            patch_bytes = include_bytes!("../offline/steam.patch");
        } else {
            patch_bytes = include_bytes!("../offline/gog.patch");
        };
        let mut temp_path_patch = std::env::temp_dir();
        temp_path_patch.push("unt.patch");
        let temp_path_patch_str = temp_path_patch.to_str().unwrap().to_string();
        std::fs::write(temp_path_patch.clone(), patch_bytes).expect("Unable to write file");
        patch_path = temp_path_patch_str;
    }
    let output = Command::new(&temp_path)
        .arg("-d")
        .arg("-s")
        .arg(source)
        .arg(patch_path.clone())
        .arg(output)
        .creation_flags(no_win)
        .output();
    //remove the temp exe
    std::fs::remove_file(temp_path).expect("Unable to remove file");
    //remove the temp patch
    if offline {
        std::fs::remove_file(patch_path).expect("Unable to remove file");
    }
    match output {
        Ok(output) => {
            if output.stderr.is_empty() {
                Ok("ok".into())
            } else {
                Err(String::from_utf8(output.stderr).unwrap())
            }
        }
        Err(e) => Err(e.to_string()),
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
            remove_file,
            create_sha256_hash_from_timestamp_with_salt,
            run_xdelta3
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
