import UIKit
import React

/// The iOS 27 SDK refuses to launch apps that still drive their UI from `UIApplicationDelegate`
/// alone, so window ownership and every UI-facing event lives here. React Native 0.86 has no
/// scene-aware entry point of its own — the window is still created here and handed to
/// `RCTReactNativeFactory` through `AppDelegate.startReactNative(in:additionalLaunchOptions:)`.
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    private var appDelegate: AppDelegate? {
        UIApplication.shared.delegate as? AppDelegate
    }

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        let window = UIWindow(windowScene: windowScene)
        self.window = window
        appDelegate?.window = window

        var additionalLaunchOptions: [UIApplication.LaunchOptionsKey: Any] = [:]
        if let shortcutItem = connectionOptions.shortcutItem {
            // A cold launch by quick action delivers the item here instead of in the app
            // delegate's launch options, which is where RNQuickActionManager reads it to build
            // its `initialAction` constant for `QuickActions.popInitialAction()`.
            additionalLaunchOptions[.shortcutItem] = shortcutItem
        }

        appDelegate?.startReactNative(in: window, additionalLaunchOptions: additionalLaunchOptions)
        appDelegate?.presentCacheClearedAlertIfNeeded()

        for userActivity in connectionOptions.userActivities {
            _ = appDelegate?.handle(userActivity: userActivity)
        }
        open(urlContexts: connectionOptions.urlContexts)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        open(urlContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        _ = appDelegate?.handle(userActivity: userActivity)
    }

    func windowScene(_ windowScene: UIWindowScene, performActionFor shortcutItem: UIApplicationShortcutItem, completionHandler: @escaping (Bool) -> Void) {
        appDelegate?.handle(shortcutItem: shortcutItem, completionHandler: completionHandler)
    }

    /// `RCTLinkingManager` only exposes the app-delegate shaped entry point, so each context is
    /// unpacked back into an `application(_:open:options:)` style options dictionary.
    private func open(urlContexts: Set<UIOpenURLContext>) {
        for context in urlContexts {
            var options: [UIApplication.OpenURLOptionsKey: Any] = [
                .openInPlace: context.options.openInPlace
            ]
            if let sourceApplication = context.options.sourceApplication {
                options[.sourceApplication] = sourceApplication
            }
            if let annotation = context.options.annotation {
                options[.annotation] = annotation
            }

            _ = appDelegate?.handle(openURL: context.url, options: options)
        }
    }
}
