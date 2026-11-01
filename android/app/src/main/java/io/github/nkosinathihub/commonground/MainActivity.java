package io.github.nkosinathihub.commonground;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Paints the status and gesture bar strips in the app's colours (SystemChromePlugin).
        registerPlugin(SystemChromePlugin.class);
        super.onCreate(savedInstanceState);
        // Fullscreen playback turns to landscape and keeps the screen awake (PlayerChromeClient).
        bridge.getWebView().setWebChromeClient(new PlayerChromeClient(bridge));
    }
}
