package com.dijitaltesbih.app;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Enable WebView debugging for Chrome DevTools
        // This allows us to inspect the WebView and see JavaScript errors
        WebView.setWebContentsDebuggingEnabled(true);
    }
}
