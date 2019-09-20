import { PersistentStatefulService } from 'services/core/persistent-stateful-service';
import { mutation, ViewHandler } from './core/stateful-service';
import Vue from 'vue';
import { Inject } from 'services/core';
import { AppService } from 'services/app';

export enum EDismissable {
  SceneCollectionsHelpTip = 'scene_collections_help_tip',
  RecentEventsHelpTip = 'recent_events_help_tip',
}

interface IDismissablesServiceState {
  [key: string]: boolean;
}

class DismissablesViews extends ViewHandler<IDismissablesServiceState> {
  shouldShow(key: EDismissable) {
    return !this.state[key];
  }
}

/**
 * A dismissable is anything that can be dismissed and should
 * never show up again, like a help tip.
 */
export class DismissablesService extends PersistentStatefulService<IDismissablesServiceState> {
  @Inject() appService: AppService;

  init() {
    super.init();

    Object.values(EDismissable).forEach(key => {
      // Some keys have extra show criteria
      if (key === EDismissable.RecentEventsHelpTip && !this.state[key]) {
        // If this is a fresh cache, never show the tip
        if (this.appService.state.onboarded) {
          this.dismiss(key);
        }
      }
    });
  }

  get views() {
    return new DismissablesViews(this.state);
  }

  dismiss(key: EDismissable) {
    this.DISMISS(key);
  }

  dismissAll() {
    Object.keys(EDismissable).forEach(key => this.dismiss(EDismissable[key]));
  }

  @mutation()
  DISMISS(key: EDismissable) {
    Vue.set(this.state, key, true);
  }
}
