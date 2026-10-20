package ecurrency.org.ecrwallet

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.util.Log

object AppWidgetUtils {
    private const val TAG = "AppWidgetUtils"

    /**
     * Get all Ecurrency Price Widget IDs
     */
    fun getEcurrencyPriceWidgetIds(context: Context): IntArray {
        val appWidgetManager = AppWidgetManager.getInstance(context)
        val component = ComponentName(context, EcurrencyPriceWidget::class.java)
        return appWidgetManager.getAppWidgetIds(component)
    }

    /**
     * Trigger update for all widgets when theme changes
     */
    fun updateWidgetsForThemeChange(context: Context) {
        Log.d(TAG, "Updating widgets for theme change")

        // Update Ecurrency Price widgets - force a complete refresh
        val ecurrencyWidgetIds = getEcurrencyPriceWidgetIds(context)
        if (ecurrencyWidgetIds.isNotEmpty()) {
            for (widgetId in ecurrencyWidgetIds) {
                EcurrencyPriceWidget.refreshWidget(context, widgetId)
            }
        }

        // Update Market widgets
        val marketWidgetIds = MarketWidget.getAllWidgetIds(context)
        if (marketWidgetIds.isNotEmpty()) {
            MarketWidget.refreshAllWidgetsImmediately(context)
        }
    }
}
