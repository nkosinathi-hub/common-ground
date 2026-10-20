package io.github.nkosinathihub.commonground;

import android.app.Activity;
import android.content.pm.ActivityInfo;
import android.view.View;
import android.view.WindowManager;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeWebChromeClient;

/**
 * Capacitor's chrome client already shows WebView fullscreen video (onShowCustomView). This adds
 * what a player needs while fullscreen: landscape, and a screen that stays awake.
 */
public class PlayerChromeClient extends BridgeWebChromeClient {
    private final Activity activity;
    private int orientationBefore = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED;

    public PlayerChromeClient(Bridge bridge) {
        super(bridge);
        this.activity = bridge.getActivity();
    }

    @Override
    public void onShowCustomView(View view, CustomViewCallback callback) {
        super.onShowCustomView(view, callback);
        orientationBefore = activity.getRequestedOrientation();
        activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
        activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }

    @Override
    public void onHideCustomView() {
        super.onHideCustomView();
        activity.setRequestedOrientation(orientationBefore);
        activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }
}
