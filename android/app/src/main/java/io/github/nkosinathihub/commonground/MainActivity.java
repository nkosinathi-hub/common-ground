package io.github.nkosinathihub.commonground;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Fullscreen playback turns to landscape and keeps the screen awake (PlayerChromeClient).
        bridge.getWebView().setWebChromeClient(new PlayerChromeClient(bridge));
    }
}
