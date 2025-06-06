import {
  Component,
  inject,
  signal,
  OnInit,
  OnDestroy,
  ViewChild,
  PLATFORM_ID,
  ElementRef,
  AfterViewInit,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { HttpClientModule } from '@angular/common/http';
import { Subscription } from 'rxjs';

// Import Swiper JS
import { register } from 'swiper/element/bundle';
// Register Swiper custom elements
register();

import { ThemeService } from '@core/services/theme.service';
import { LanguageService } from '@core/services/language.service';
import { OffersService, Offer } from './services/offers.service';
import { trackByIndexAndId, trackByValue } from '@shared/utils/track-by.util';

// Import the NzCardAlt component
import { NzCardAltComponent } from '@shared/components/nz-card-alt/nz-card-alt.component';

@Component({
  selector: 'app-offers-cards',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzTypographyModule,
    NzBadgeModule,
    NzSkeletonModule,
    NzGridModule,
    HttpClientModule,
    NzCardAltComponent,
  ],
  templateUrl: './offers-cards.component.html',
  styleUrls: ['./offers-cards.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class OffersCardsComponent implements OnInit, AfterViewInit, OnDestroy {
  private themeService = inject(ThemeService);
  public translateService = inject(TranslateService);
  private languageService = inject(LanguageService);
  private offersService = inject(OffersService);
  private platformId = inject(PLATFORM_ID);

  // Use signals for reactive state
  theme = this.themeService.theme;
  language = this.languageService.language;

  private langSubscription!: Subscription;
  private offersSubscription!: Subscription;
  private swiperInstance: any = null;
  isLoading = true;
  hasError = false;

  @ViewChild('swiperEl') swiperEl!: ElementRef;

  // Offers data
  offers: Offer[] = [];

  // Limited offers for desktop view
  get displayedOffers(): Offer[] {
    // Take the first 6 offers for desktop view
    return this.offers.slice(0, 6);
  }

  addToCart(offer: Offer): void {
    console.log('Added to cart:', offer);
    // Implement add to cart functionality
  }

  buyNow(offer: Offer): void {
    console.log('Buy now:', offer);
    // Implement buy now functionality
  }

  /**
   * Load offers from the API using the selected country code
   */
  public loadOffers(): void {
    this.isLoading = true;
    this.hasError = false;

    // Use the service without parameters - it will get country code from the store
    this.offersSubscription = this.offersService.getOffers().subscribe({
      next: (data) => {
        console.log('Loaded offer IDs:', JSON.stringify(data.map((o) => o.id)));
        this.offers = data;
        this.isLoading = false;

        // Initialize swiper after data is loaded
        setTimeout(() => {
          this.initSwiper();
        }, 0);
      },
      error: (error) => {
        console.error('Error loading offers:', error);
        this.isLoading = false;
        this.hasError = true;
      },
    });
  }

  ngOnInit(): void {
    // Subscribe to language changes
    this.langSubscription = this.translateService.onLangChange.subscribe(() => {
      this.loadOffers();
    });

    // Initial load of offers
    this.loadOffers();
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Wait for the DOM to be fully rendered
      setTimeout(() => {
        this.initSwiper();
      }, 0);
    }
  }

  /**
   * Initialize Swiper with custom options
   */
  private initSwiper(): void {
    if (!isPlatformBrowser(this.platformId) || !this.swiperEl?.nativeElement) {
      return;
    }

    try {
      const isRtl = this.language() === 'ar';
      const swiperElement = this.swiperEl.nativeElement;

      // Make sure we destroy any existing instance first
      if (swiperElement.swiper) {
        swiperElement.swiper.destroy();
      }

      // Set direction attribute
      swiperElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');

      // Define and apply Swiper parameters
      const params = {
        // Use fixed width slides instead of slidesPerView
        slidesPerView: 'auto',
        spaceBetween: 16,
        pagination: {
          clickable: true,
          dynamicBullets: true,
        },
        navigation: false,
        loop: false,
        rewind: false,
        freeMode: {
          enabled: false,
        },
        resistance: true,
        resistanceRatio: 0.85,
        touchRatio: 1,
        grabCursor: true,
        preventClicks: true,
        touchStartPreventDefault: false,
        centeredSlides: false,
        cssMode: true, // Use CSS for transitions (smoother on mobile)
        watchSlidesProgress: true,
        watchOverflow: true, // Disable navigation/pagination when all slides are visible

        // Fix for infinite sliding - specify more detailed breakpoints
        breakpoints: {
          0: {
            slidesPerView: 'auto',
            spaceBetween: 8,
          },
          480: {
            slidesPerView: 'auto',
            spaceBetween: 12,
          },
          600: {
            slidesPerView: 'auto',
            spaceBetween: 16,
          },
        },
      };

      // Initialize Swiper with parameters
      Object.assign(swiperElement, params);

      // Initialize swiper manually
      swiperElement.initialize();

      // Store reference for cleanup
      this.swiperInstance = swiperElement.swiper;

      // Add event listeners
      swiperElement.addEventListener('progress', (e: any) => {
        // Check if we're at the end
        const swiper = e.detail[0];
        if (swiper && swiper.isEnd) {
          console.log('Reached end of slides');
          // We could add additional visual feedback here
        }
      });

      // Log for debugging
      console.log('Swiper initialized with params:', params);
    } catch (error) {
      console.error('Error initializing Swiper:', error);
    }
  }

  ngOnDestroy(): void {
    if (this.langSubscription) {
      this.langSubscription.unsubscribe();
    }

    if (this.offersSubscription) {
      this.offersSubscription.unsubscribe();
    }

    // Destroy Swiper instance
    if (this.swiperInstance) {
      this.swiperInstance.destroy();
      this.swiperInstance = null;
    }
  }

  // Tracking functions for the @for loops
  trackByOfferIdAndIndex(index: number, offer: Offer): string {
    return trackByIndexAndId(index, offer);
  }

  trackByIndex(index: number, item: number): string {
    return trackByValue(index, item);
  }
}
