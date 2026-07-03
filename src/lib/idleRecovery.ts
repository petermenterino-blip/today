import { logger } from './logger';

type RecoveryCallback = () => void | Promise<void>;

interface IdleRecoveryConfig {
  onVisibilityVisible?: RecoveryCallback;
  onNetworkOnline?: RecoveryCallback;
  onSessionValidate?: RecoveryCallback;
  onFullRecovery?: RecoveryCallback;
}

class IdleRecoveryManager {
  private static instance: IdleRecoveryManager;
  private callbacks: IdleRecoveryConfig = {};
  private isRecovering = false;
  private lastVisibilityChange = 0;
  private visibilityHandler: (() => void) | null = null;
  private focusHandler: (() => void) | null = null;
  private onlineHandler: (() => void) | null = null;
  private offlineHandler: (() => void) | null = null;
  private _isOnline = true;

  private constructor() {}

  static getInstance(): IdleRecoveryManager {
    if (!IdleRecoveryManager.instance) {
      IdleRecoveryManager.instance = new IdleRecoveryManager();
    }
    return IdleRecoveryManager.instance;
  }

  get isOnline() {
    return this._isOnline;
  }

  configure(config: IdleRecoveryConfig) {
    this.callbacks = config;
  }

  mount() {
    if (typeof document === 'undefined') return;

    this.visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        const timeSinceLastVisible = now - this.lastVisibilityChange;
        this.lastVisibilityChange = now;

        logger.info('IdleRecovery', 'Tab became visible', {
          hiddenMs: timeSinceLastVisible,
        });

        if (timeSinceLastVisible > 5000) {
          this.triggerRecovery('visibility-change');
        }
      } else {
        this.lastVisibilityChange = Date.now();
      }
    };

    this.focusHandler = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        const timeSinceLastVisible = now - this.lastVisibilityChange;
        if (timeSinceLastVisible > 5000) {
          logger.info('IdleRecovery', 'Window focused after idle', {
            hiddenMs: timeSinceLastVisible,
          });
          this.triggerRecovery('window-focus');
        }
        this.lastVisibilityChange = now;
      }
    };

    this.onlineHandler = () => {
      this._isOnline = true;
      logger.info('IdleRecovery', 'Network online');
      this.callbacks.onNetworkOnline?.();
      this.triggerRecovery('network-online');
    };

    this.offlineHandler = () => {
      this._isOnline = false;
      logger.warn('IdleRecovery', 'Network offline');
    };

    document.addEventListener('visibilitychange', this.visibilityHandler);
    window.addEventListener('focus', this.focusHandler);
    window.addEventListener('online', this.onlineHandler);
    window.addEventListener('offline', this.offlineHandler);

    logger.info('IdleRecovery', 'Recovery system mounted');
  }

  unmount() {
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    }
    if (this.focusHandler) {
      window.removeEventListener('focus', this.focusHandler);
    }
    if (this.onlineHandler) {
      window.removeEventListener('online', this.onlineHandler);
    }
    if (this.offlineHandler) {
      window.removeEventListener('offline', this.offlineHandler);
    }
  }

  private async triggerRecovery(source: string) {
    if (this.isRecovering) {
      logger.debug('IdleRecovery', `Skipping recovery (already in progress) from ${source}`);
      return;
    }

    this.isRecovering = true;
    logger.info('IdleRecovery', `Starting recovery triggered by ${source}`);

    try {
      await this.callbacks.onSessionValidate?.();
      await this.callbacks.onVisibilityVisible?.();
      await this.callbacks.onFullRecovery?.();
      logger.info('IdleRecovery', `Recovery complete from ${source}`);
    } catch (err) {
      logger.error('IdleRecovery', `Recovery failed from ${source}`, {
        error: String(err),
      });
    } finally {
      this.isRecovering = false;
    }
  }

  async forceRecovery() {
    await this.triggerRecovery('manual');
  }
}

export const idleRecovery = IdleRecoveryManager.getInstance();
