import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { Subscription } from 'rxjs';

import { MainBannerService, MainBanner } from './services/main-banner.service';
import { ThemeService } from '@core/services/theme.service';
import { LanguageService } from '@core/services/language.service';

@Component({
  selector: 'app-main-banner',
  standalone: true,
  imports: [CommonModule, TranslateModule, NzSkeletonModule, NzButtonModule],
  templateUrl: './main-banner.component.html',
  styleUrls: ['./main-banner.component.scss'],
})
export class MainBannerComponent implements OnInit, OnDestroy {
  private themeService = inject(ThemeService);
  private languageService = inject(LanguageService);
  private translateService = inject(TranslateService);
  private mainBannerService = inject(MainBannerService);

  // Use signals for reactive state
  theme = this.themeService.theme;
  language = this.languageService.language;

  // Banner data
  banner: MainBanner | null = null;
  isLoading = true;
  hasError = false;

  private langSubscription!: Subscription;
  private bannerSubscription!: Subscription;

  ngOnInit(): void {
    // Load banner on init
    this.loadBanner();

    // Subscribe to language changes
    this.langSubscription = this.translateService.onLangChange.subscribe(() => {
      // Reload banner when language changes
      this.loadBanner();
    });
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    if (this.langSubscription) {
      this.langSubscription.unsubscribe();
    }

    if (this.bannerSubscription) {
      this.bannerSubscription.unsubscribe();
    }
  }

  /**
   * Load main banner from API
   */
  loadBanner(): void {
    this.isLoading = true;
    this.hasError = false;

    // Use the service without parameters - it will get country code from the store
    this.bannerSubscription = this.mainBannerService.getMainBanner().subscribe({
      next: (data) => {
        this.banner = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading main banner:', error);
        this.isLoading = false;
        this.hasError = true;
      },
    });
  }
}
