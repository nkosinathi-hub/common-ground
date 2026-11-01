package io.github.nkosinathihub.commonground;

import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.ColorFilter;
import android.graphics.Paint;
import android.graphics.PixelFormat;
import android.graphics.Rect;
import android.graphics.drawable.Drawable;
import android.view.View;
import androidx.core.graphics.ColorUtils;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Before WebView 140 Capacitor pads the window for the status and gesture bars, and the strips
 * show the plain window. The page sends its own colours (src/app/native/system-bars.ts): the top
 * half of the window takes the page background, the bottom half the tab bar, and the bar icons
 * turn dark or light to stay readable.
 */
@CapacitorPlugin(name = "SystemChrome")
public class SystemChromePlugin extends Plugin {
    @PluginMethod
    public void setColors(PluginCall call) {
        final int top;
        final int bottom;
        try {
            top = Color.parseColor(call.getString("top", "#ffffff"));
            bottom = Color.parseColor(call.getString("bottom", "#ffffff"));
        } catch (IllegalArgumentException e) {
            call.reject("Colours must be #rrggbb");
            return;
        }
        getActivity().runOnUiThread(() -> {
            View decor = getActivity().getWindow().getDecorView();
            decor.setBackground(new SplitDrawable(top, bottom));
            WindowInsetsControllerCompat bars = new WindowInsetsControllerCompat(getActivity().getWindow(), decor);
            bars.setAppearanceLightStatusBars(ColorUtils.calculateLuminance(top) > 0.5);
            bars.setAppearanceLightNavigationBars(ColorUtils.calculateLuminance(bottom) > 0.5);
            call.resolve();
        });
    }

    /** One colour over the top half, another over the bottom half. */
    private static final class SplitDrawable extends Drawable {
        private final Paint top = new Paint();
        private final Paint bottom = new Paint();

        SplitDrawable(int topColor, int bottomColor) {
            top.setColor(topColor);
            bottom.setColor(bottomColor);
        }

        @Override
        public void draw(Canvas canvas) {
            Rect b = getBounds();
            canvas.drawRect(b.left, b.top, b.right, b.centerY(), top);
            canvas.drawRect(b.left, b.centerY(), b.right, b.bottom, bottom);
        }

        @Override
        public void setAlpha(int alpha) {}

        @Override
        public void setColorFilter(ColorFilter filter) {}

        @Override
        public int getOpacity() {
            return PixelFormat.OPAQUE;
        }
    }
}
