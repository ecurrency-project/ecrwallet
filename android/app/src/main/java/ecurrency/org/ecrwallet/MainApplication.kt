package ecurrency.org.ecrwallet

import android.app.Application
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.SharedPreferences
import android.util.Log
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.modules.i18nmanager.I18nUtil
import ecurrency.org.ecrwallet.components.segmentedcontrol.CustomSegmentedControlPackage

class MainApplication : Application(), ReactApplication {

    private lateinit var sharedPref: SharedPreferences
    private val themeChangeReceiver = ThemeChangeReceiver()
    private val preferenceChangeListener = SharedPreferences.OnSharedPreferenceChangeListener { prefs, key ->
        if (key == "preferredCurrency") {
            prefs.edit().remove("previous_price").apply()

            // Update BitcoinPrice widgets
            WidgetUpdateWorker.scheduleWork(this)

            // Immediately refresh Market widgets
            MarketWidget.refreshAllWidgetsImmediately(this)
        } else if (key == "force_dark_mode") {
            // Theme setting changed, update all widgets
            ThemeHelper.updateAllWidgets(this)
        }
    }

    override val reactHost: ReactHost by lazy {
        getDefaultReactHost(
            context = applicationContext,
            packageList =
                PackageList(this).packages.apply {
                    // Packages that cannot be autolinked yet can be added manually here, for example:
                    // add(MyReactNativePackage())
                    add(CustomSegmentedControlPackage())
                },
        )
    }

    override fun onCreate() {
        super.onCreate()
        sharedPref = getSharedPreferences("group.ecurrency.org.ecrwallet", Context.MODE_PRIVATE)
        sharedPref.registerOnSharedPreferenceChangeListener(preferenceChangeListener)

        // Register the theme change receiver
        registerReceiver(themeChangeReceiver, IntentFilter(Intent.ACTION_CONFIGURATION_CHANGED))

        val sharedI18nUtilInstance = I18nUtil.getInstance()
        sharedI18nUtilInstance.allowRTL(applicationContext, true)

        loadReactNative(this)
    }

    override fun onTerminate() {
        super.onTerminate()
        sharedPref.unregisterOnSharedPreferenceChangeListener(preferenceChangeListener)

        // Unregister the theme change receiver
        try {
            unregisterReceiver(themeChangeReceiver)
        } catch (e: Exception) {
            Log.e("MainApplication", "Error unregistering theme receiver", e)
        }
    }
}
