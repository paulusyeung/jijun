package com.walkingfish.easyaccounting;

import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Edge-to-edge display: extend content under system bars
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        // Set status bar and navigation bar styling
        View decorView = getWindow().getDecorView();
        WindowInsetsControllerCompat controller = new WindowInsetsControllerCompat(getWindow(), decorView);

        // Light status bar icons on light background
        controller.setAppearanceLightStatusBars(true);

        // Make navigation bar transparent with light icons
        getWindow().setNavigationBarColor(android.graphics.Color.TRANSPARENT);
        controller.setAppearanceLightNavigationBars(true);
    }
}
