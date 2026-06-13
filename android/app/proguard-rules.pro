# 輕鬆記帳 ProGuard / R8 規則
# Capacitor v8 + 所有 plugin keep rules

# ===== Capacitor Bridge =====
-keep class com.getcapacitor.** { *; }
-keep class com.getcapacitor.Bridge { *; }
-keep class * extends com.getcapacitor.Plugin { *; }
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# ===== 應用程式封包 =====
-keep class com.walkingfish.easyaccounting.** { *; }

# ===== Capacitor 社群 Plugins =====
# @capacitor-community/admob
-keep class com.capacitorcommunity.admob.** { *; }

# ===== Capacitor 官方 Plugins =====
# @capacitor/local-notifications
-keep class com.capacitor.localnotification.** { *; }
# @capacitor/share
-keep class com.capacitor.share.** { *; }
# @capacitor/filesystem
-keep class com.capacitor.filesystem.** { *; }
# @capacitor/haptics
-keep class com.capacitor.haptics.** { *; }
# @capacitor/status-bar
-keep class com.capacitor.statusbar.** { *; }
# @capacitor/splash-screen
-keep class com.capacitor.splashscreen.** { *; }

# ===== Google Play Services =====
-keep class com.google.android.gms.** { *; }
-keep class com.google.gson.** { *; }

# ===== codetrix Capacitor Google Auth =====
-keep class com.codetrix.** { *; }

# ===== 其他 =====
# Keep annotations
-keepattributes *Annotation*

# Keep WebView
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Prevent obfuscation of plugin method names called from JavaScript
-keepclassmembers class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.annotation.CapacitorMethod <methods>;
}
