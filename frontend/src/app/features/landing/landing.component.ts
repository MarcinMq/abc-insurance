import { Component, AfterViewInit, OnDestroy, HostListener, inject, PLATFORM_ID, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

const features = [
  {
    iconPath: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12',
    title: 'Komunikacyjne',
    desc: 'OC, AC, Assistance — pełna ochrona Twojego pojazdu na każdą podróż.',
    accent: '#0a84ff',
  },
  {
    iconPath: 'M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819',
    title: 'Nieruchomości',
    desc: 'Dom, mieszkanie, wyposażenie. Ochrona przed żywiołami i kradzieżą.',
    accent: '#30d158',
  },
  {
    iconPath: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z',
    title: 'Zdrowotne',
    desc: 'Prywatna opieka medyczna, hospitalizacja, badania specjalistyczne.',
    accent: '#ff453a',
  },
  {
    iconPath: 'M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5',
    title: 'Podróżne',
    desc: 'Podróżuj bez obaw. Koszty leczenia, bagaż, odwołanie lotu.',
    accent: '#ff9f0a',
  },
  {
    iconPath: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z',
    title: 'Na życie',
    desc: 'Zabezpiecz przyszłość swoich bliskich. Elastyczne warianty ochrony.',
    accent: '#bf5af2',
  },
  {
    iconPath: 'M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z',
    title: 'OC zawodowe',
    desc: 'Odpowiedzialność cywilna — dla firm, freelancerów i specjalistów.',
    accent: '#64d2ff',
  },
];

const slides = [
  {
    step: '01',
    title: 'Zgłoś szkodę w 60 sekund',
    desc: 'Intuicyjny formularz prowadzi Cię krok po kroku. Zdjęcia, lokalizacja, opis — wszystko bez zbędnych formalności.',
    accent: '#0a84ff',
  },
  {
    step: '02',
    title: 'Śledź status na żywo',
    desc: 'Od zgłoszenia, przez ocenę agenta, do wypłaty odszkodowania. Pełna transparentność na każdym etapie.',
    accent: '#30d158',
  },
  {
    step: '03',
    title: 'Agent zawsze pod ręką',
    desc: 'Dedykowany agent ubezpieczeniowy dostępny bezpośrednio w Twoim panelu. Bez infolinii i czekania.',
    accent: '#ff9f0a',
  },
];

const chartBars = [35, 55, 45, 72, 58, 85, 68, 78, 50, 65, 88, 60, 75, 90, 62, 82];

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <!-- Noise Overlay -->
    <div class="noise-overlay"></div>

    <!-- Scroll progress -->
    <div class="fixed top-0 left-0 h-[2px] z-[9999] transition-all duration-100"
         [style.width.%]="scrollProgress"
         style="background: linear-gradient(90deg, #0a84ff 0%, #409cff 50%, #64d2ff 100%)">
    </div>

    <!-- Navbar -->
    <header class="fixed top-0 left-0 w-full z-50 transition-all duration-500"
            [style.background]="scrolled ? 'rgba(0,0,0,0.78)' : 'transparent'"
            [style.backdrop-filter]="scrolled ? 'saturate(180%) blur(20px)' : 'none'"
            [style.border-bottom]="scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent'">
      <nav class="max-w-[1120px] mx-auto flex items-center justify-between h-11 px-6 lg:px-8">
        <a routerLink="/" class="font-semibold text-[15px] text-[#f5f5f7] tracking-tight flex items-center gap-2">
          <span class="inline-flex items-center justify-center w-6 h-6 rounded-md bg-[#0a84ff]/15 text-[11px]">🛡️</span>
          ABC Insurance
        </a>
        <div class="hidden md:flex items-center gap-7">
          <a href="#ochrona" class="text-[13px] text-[#b0b0b5] hover:text-white transition-colors">Ochrona</a>
          <a href="#polisy" class="text-[13px] text-[#b0b0b5] hover:text-white transition-colors">Platforma</a>
          <a href="#szkody" class="text-[13px] text-[#b0b0b5] hover:text-white transition-colors">O nas</a>
          <a href="#kontakt" class="text-[13px] text-[#b0b0b5] hover:text-white transition-colors">Kontakt</a>
        </div>
        <div class="hidden md:flex items-center gap-3">
          @if (isLoggedIn()) {
            <span class="text-[13px] text-[#b0b0b5]">{{ user()?.first_name || user()?.username }}</span>
            <a routerLink="/dashboard"
               class="h-[30px] inline-flex items-center rounded-full bg-[#0a84ff] px-4 text-[13px] font-medium text-white hover:bg-[#409cff] transition-all glow-hover">
              Mój panel
            </a>
            <button (click)="logout()"
                    class="h-[30px] inline-flex items-center rounded-full px-4 text-[13px] font-medium text-[#b0b0b5] border border-[rgba(255,255,255,0.1)] hover:text-white hover:border-[rgba(255,255,255,0.2)] transition-all glass">
              Wyloguj
            </button>
          } @else {
            <a routerLink="/login"
               class="h-[30px] inline-flex items-center rounded-full px-4 text-[13px] font-medium text-[#b0b0b5] hover:text-white transition-all">
              Zaloguj się
            </a>
            <a routerLink="/login"
               class="h-[30px] inline-flex items-center rounded-full bg-[#0a84ff] px-4 text-[13px] font-medium text-white hover:bg-[#409cff] transition-all glow-hover">
              Uzyskaj ofertę
            </a>
          }
        </div>
        <!-- Mobile hamburger -->
        <button class="flex md:hidden flex-col gap-[5px] p-1" (click)="mobileMenuOpen = !mobileMenuOpen">
          <span class="block w-5 h-[1.5px] bg-white rounded-full"></span>
          <span class="block w-5 h-[1.5px] bg-white rounded-full"></span>
        </button>
      </nav>

      <!-- Mobile menu dropdown -->
      @if (mobileMenuOpen) {
        <div class="flex md:hidden flex-col border-t border-[rgba(255,255,255,0.06)]"
             style="background: rgba(0,0,0,0.96); backdrop-filter: blur(20px)">
          <div class="px-6 py-4 flex flex-col gap-1">
            <a href="#ochrona" (click)="mobileMenuOpen=false" class="py-3 text-[15px] text-[#d1d1d6] border-b border-[rgba(255,255,255,0.05)]">Ochrona</a>
            <a href="#polisy" (click)="mobileMenuOpen=false" class="py-3 text-[15px] text-[#d1d1d6] border-b border-[rgba(255,255,255,0.05)]">Platforma</a>
            <a href="#szkody" (click)="mobileMenuOpen=false" class="py-3 text-[15px] text-[#d1d1d6] border-b border-[rgba(255,255,255,0.05)]">O nas</a>
            <a href="#kontakt" (click)="mobileMenuOpen=false" class="py-3 text-[15px] text-[#d1d1d6] border-b border-[rgba(255,255,255,0.05)]">Kontakt</a>
            <div class="pt-3 flex flex-col gap-2">
              @if (isLoggedIn()) {
                <a routerLink="/dashboard" (click)="mobileMenuOpen=false"
                   class="h-11 flex items-center justify-center rounded-xl bg-[#0a84ff] text-white text-[15px] font-medium">
                  Panel klienta
                </a>
                <button (click)="logout(); mobileMenuOpen=false"
                        class="h-11 flex items-center justify-center rounded-xl border border-[rgba(255,255,255,0.1)] text-[#b0b0b5] text-[15px]">
                  Wyloguj
                </button>
              } @else {
                <a routerLink="/login" (click)="mobileMenuOpen=false"
                   class="h-11 flex items-center justify-center rounded-xl bg-[#0a84ff] text-white text-[15px] font-medium">
                  Zaloguj się
                </a>
                <a routerLink="/register" (click)="mobileMenuOpen=false"
                   class="h-11 flex items-center justify-center rounded-xl border border-[rgba(255,255,255,0.1)] text-[#d1d1d6] text-[15px]">
                  Zarejestruj się
                </a>
              }
            </div>
          </div>
        </div>
      }
    </header>

    <!-- Hero -->
    <section class="scroll-snap-section relative h-screen min-h-[700px] overflow-hidden bg-black flex items-center justify-center">

      <!-- Wideo w tle -->
      <video #heroVideo
             class="absolute inset-0 w-full h-full object-cover"
             autoplay loop playsinline
             [muted]="true">
        <source src="hero-video.mp4" type="video/mp4">
      </video>

      <!-- Przyciemnienie wideo -->
      <div class="absolute inset-0 bg-black/55"></div>

      <!-- Efekt kwadratów — siatka kafli które znikają losowo -->
      <div id="tile-grid" class="absolute inset-0 z-10 pointer-events-none"></div>

      <!-- Treść -->
      <div class="relative z-20 flex flex-col items-center text-center px-6 hero-content">
        <div class="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.15)] glass px-4 py-1.5 mb-8">
          <span class="w-1.5 h-1.5 rounded-full bg-[#30d158] pulse"></span>
          <span class="text-[13px] text-[#d1d1d6]">Platforma ubezpieczeniowa nowej generacji</span>
        </div>
        <h1 class="text-[clamp(2.5rem,7vw,5.5rem)] font-bold tracking-[-0.03em] leading-[1.05] text-white max-w-[900px]">
          Ochrona, której<br>
          <span class="gradient-text" style="background: linear-gradient(90deg, #0a84ff, #409cff, #64d2ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; background-size: 200% auto;">
            możesz zaufać
          </span>
        </h1>
        <p class="mt-5 text-[clamp(1rem,2vw,1.25rem)] text-white/70 max-w-[540px] leading-relaxed">
          Polisy auto, nieruchomości, zdrowotne i&nbsp;podróżne — wszystko w jednym miejscu, bez zbędnych formalności.
        </p>
        <div class="mt-10 flex flex-col sm:flex-row items-center gap-3">
          @if (isLoggedIn()) {
            <a routerLink="/dashboard"
               class="magnetic-btn h-12 inline-flex items-center justify-center rounded-full bg-[#0a84ff] px-8 text-[15px] font-medium text-white hover:bg-[#409cff] transition-all hover:shadow-[0_0_30px_rgba(10,132,255,0.4)]">
              Przejdź do panelu
              <svg class="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
              </svg>
            </a>
          } @else {
            <a href="#ochrona"
               class="magnetic-btn h-12 inline-flex items-center justify-center rounded-full bg-[#0a84ff] px-8 text-[15px] font-medium text-white hover:bg-[#409cff] transition-all hover:shadow-[0_0_30px_rgba(10,132,255,0.4)]">
              Poznaj ofertę
            </a>
            <a href="#kontakt"
               class="magnetic-btn h-12 inline-flex items-center justify-center rounded-full border border-white/30 px-8 text-[15px] font-medium text-white hover:border-white/60 transition-all backdrop-blur-sm">
              Porozmawiaj z agentem
              <svg class="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
              </svg>
            </a>
          }
        </div>
        <div class="mt-8 flex justify-center">
          <div class="w-[22px] h-[36px] rounded-full border-2 border-white/30 flex items-start justify-center p-1.5">
            <div class="w-[3px] h-[8px] rounded-full bg-white/60 scroll-dot"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Grid -->
    <section id="ochrona" class="scroll-snap-section relative z-10 bg-black py-28 md:py-36 px-6">
      <div class="max-w-[1120px] mx-auto">
        <div class="text-center mb-16 md:mb-20 fade-in">
          <p class="text-[#0a84ff] text-[13px] font-medium tracking-[0.12em] uppercase mb-3">Kompleksowa ochrona</p>
          <h2 class="text-[clamp(1.75rem,4.5vw,3rem)] font-bold tracking-[-0.02em] text-white">Wszystko, czego potrzebujesz.</h2>
          <p class="mt-3 text-[17px] text-[#86868b] max-w-md mx-auto leading-relaxed">Sześć kategorii ubezpieczeń. Jedna platforma. Pełna kontrola.</p>
        </div>
        <div id="features-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (f of features; track f.title; let i = $index) {
            <div class="feature-card tilt-card card-shine group relative rounded-2xl bg-[#111112] border border-[rgba(255,255,255,0.05)] p-7 transition-colors duration-500 hover:border-[rgba(255,255,255,0.1)] fade-in"
                 [style.transition-delay]="(i * 80) + 'ms'"
                 (mousemove)="onCardMouseMove($event)"
                 (mouseleave)="onCardMouseLeave($event)">
              <div class="floating bounce-hover w-10 h-10 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                   [style.background]="f.accent + '18'"
                   [style.color]="f.accent">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-6 h-6">
                  <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="f.iconPath"/>
                </svg>
              </div>
              <h3 class="text-[17px] font-semibold text-white mb-1.5 tracking-[-0.01em]">{{ f.title }}</h3>
              <p class="text-[14px] text-[#86868b] leading-relaxed">{{ f.desc }}</p>
              <div class="feature-spotlight absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- Text Reveal -->
    <section id="text-reveal" class="scroll-snap-section relative z-10 bg-black py-36 md:py-48 px-6">
      <div class="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black to-transparent pointer-events-none"></div>
      <div class="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black to-transparent pointer-events-none"></div>
      <p class="max-w-[860px] mx-auto text-[clamp(1.5rem,4vw,2.75rem)] font-semibold leading-[1.3] tracking-[-0.02em] text-white text-center flex flex-wrap justify-center gap-x-[0.3em] gap-y-[0.1em]">
        @for (word of revealWords; track $index) {
          <span [style.opacity]="revealOpacities[$index]" style="transition: opacity 0.1s">{{ word }}</span>
        }
      </p>
    </section>

    <!-- Product Showcase -->
    <section id="polisy" class="scroll-snap-section relative z-[1] bg-black py-28 md:py-36 px-6">
      <div class="max-w-[1120px] mx-auto">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <!-- Phone mockup -->
          <!-- perspective musi być na rodzicu obracającego się elementu -->
          <div class="relative flex justify-center fade-in" style="perspective: 1200px;">

            <!-- Glow — poza kontekstem 3D, żeby nie obracał się razem z telefonem -->
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[570px] pointer-events-none">
              <div class="absolute -inset-12 rounded-full bg-[radial-gradient(circle,rgba(10,132,255,0.1),transparent_60%)] blur-xl"></div>
            </div>

            <!-- Obracający się kontener -->
            <div id="phone-spin" style="position: relative; width: 280px; height: 570px; transform-style: preserve-3d;">

              <!-- TYŁ telefonu: wstępnie obrócony o 180°, CSS backface-visibility ukrywa go gdy przód jest zwrócony do użytkownika -->
              <div id="phone-back" class="absolute inset-0 rounded-[48px] bg-gradient-to-b from-[#2c2c2e] to-[#1a1a1c] border border-[rgba(255,255,255,0.08)] shadow-[0_0_0_1px_rgba(0,0,0,0.5),0_25px_80px_rgba(0,0,0,0.6)]"
                   style="backface-visibility: hidden; transform: rotateY(180deg);">
                <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-[rgba(255,255,255,0.05)] flex items-center justify-center">
                  <span class="text-2xl">🛡️</span>
                </div>
              </div>

              <!-- PRZÓD telefonu: backface-visibility ukrywa go gdy tył jest zwrócony do użytkownika -->
              <div id="phone-front" class="absolute inset-0 rounded-[48px] bg-gradient-to-b from-[#1c1c1e] to-[#0c0c0d] border border-[rgba(255,255,255,0.08)] shadow-[0_0_0_1px_rgba(0,0,0,0.5),0_25px_80px_rgba(0,0,0,0.6)] overflow-hidden" style="backface-visibility: hidden;">
                <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[32px] bg-black rounded-b-2xl z-10"></div>
                <div class="mx-[6px] mt-[6px] h-[calc(100%-12px)] rounded-[42px] bg-[#f2f2f7] overflow-hidden">
                  <div class="flex items-center justify-between px-8 pt-4 pb-2">
                    <span class="text-[11px] text-[#6e6e73] font-medium">9:41</span>
                    <div class="w-4 h-2.5 rounded-sm border border-[#6e6e73] flex items-center justify-end pr-[1px]">
                      <div class="w-2.5 h-1.5 rounded-[1px] bg-[#30d158]"></div>
                    </div>
                  </div>
                  <div class="px-5 pt-3">
                    <div class="text-[10px] text-[#6e6e73] uppercase tracking-wider mb-1">ABC Insurance</div>
                    <div class="text-[18px] font-semibold text-[#1c1c1e] tracking-tight">Panel klienta</div>
                    <div class="grid grid-cols-2 gap-2 mt-4">
                      <div class="bg-white rounded-xl p-3 shadow-sm border border-[rgba(0,0,0,0.05)]">
                        <div class="text-[10px] text-[#6e6e73] mb-1">Aktywne polisy</div>
                        <div class="text-[20px] font-bold text-[#1c1c1e]">3</div>
                      </div>
                      <div class="bg-white rounded-xl p-3 shadow-sm border border-[rgba(0,0,0,0.05)]">
                        <div class="text-[10px] text-[#6e6e73] mb-1">Szkody</div>
                        <div class="text-[20px] font-bold text-[#30d158]">0</div>
                      </div>
                    </div>
                    <div class="mt-4 space-y-[1px] rounded-xl overflow-hidden">
                      <div class="flex items-center gap-3 bg-white px-3 py-2.5 border-b border-[rgba(0,0,0,0.04)]">
                        <div class="w-2 h-2 rounded-full flex-shrink-0 bg-[#0a84ff]"></div>
                        <div class="flex-1 min-w-0">
                          <div class="text-[12px] text-[#1c1c1e] font-medium">Auto OC/AC</div>
                          <div class="text-[10px] text-[#6e6e73]">BMW 320d</div>
                        </div>
                      </div>
                      <div class="flex items-center gap-3 bg-white px-3 py-2.5 border-b border-[rgba(0,0,0,0.04)]">
                        <div class="w-2 h-2 rounded-full flex-shrink-0 bg-[#30d158]"></div>
                        <div class="flex-1 min-w-0">
                          <div class="text-[12px] text-[#1c1c1e] font-medium">Mieszkanie</div>
                          <div class="text-[10px] text-[#6e6e73]">ul. Kwiatowa 5</div>
                        </div>
                      </div>
                      <div class="flex items-center gap-3 bg-white px-3 py-2.5">
                        <div class="w-2 h-2 rounded-full flex-shrink-0 bg-[#ff9f0a]"></div>
                        <div class="flex-1 min-w-0">
                          <div class="text-[12px] text-[#1c1c1e] font-medium">Podróżne</div>
                          <div class="text-[10px] text-[#6e6e73]">Europa, do 15.04</div>
                        </div>
                      </div>
                    </div>
                    <div class="mt-4 w-full h-[38px] rounded-xl bg-[#0a84ff] flex items-center justify-center">
                      <span class="text-white text-[13px] font-medium">Zgłoś szkodę</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Steps -->
          <div class="relative">
            <p class="text-[13px] text-[#86868b] tracking-[0.12em] uppercase mb-8">Jak to działa</p>
            @for (s of slides; track s.step; let i = $index) {
              <div class="mb-10 fade-in" [style.transition-delay]="(i * 150) + 'ms'">
                <div class="flex items-center gap-3 mb-4">
                  <span class="inline-flex items-center justify-center w-7 h-7 rounded-lg text-[12px] font-bold"
                        [style.background]="s.accent + '15'"
                        [style.color]="s.accent">{{ s.step }}</span>
                  <div class="h-[1px] flex-1 max-w-16"
                       [style.background]="'linear-gradient(90deg, ' + s.accent + '40, transparent)'"></div>
                </div>
                <h3 class="text-[clamp(1.25rem,3vw,2rem)] font-bold text-white tracking-[-0.02em] mb-3 leading-tight">{{ s.title }}</h3>
                <p class="text-[16px] text-[#86868b] leading-relaxed max-w-[420px]">{{ s.desc }}</p>
              </div>
            }
          </div>
        </div>
      </div>
    </section>

    <!-- Dashboard Mockup (ScaleImage) -->
    <section class="scroll-snap-section relative z-10 bg-black py-24 md:py-32 px-6">
      <div class="max-w-[1120px] mx-auto">
        <div class="text-center mb-14 fade-in">
          <p class="text-[#0a84ff] text-[13px] font-medium tracking-[0.12em] uppercase mb-3">Twój panel</p>
          <h2 class="text-[clamp(1.75rem,4.5vw,3rem)] font-bold tracking-[-0.02em] text-white">Wszystko w jednym widoku.</h2>
          <p class="mt-3 text-[17px] text-[#86868b] max-w-lg mx-auto leading-relaxed">
            Zarządzaj polisami, śledź szkody i kontaktuj się z agentem — bez przełączania między aplikacjami.
          </p>
        </div>
        <div class="overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.06)] fade-in scale-parallax reveal-image">
          <div class="bg-[#0c0c0f] aspect-[16/9] relative overflow-hidden glass-strong">
            <div class="absolute inset-0 p-4 md:p-8 flex gap-4 md:gap-6">
              <div class="w-[180px] hidden lg:flex flex-col bg-[rgba(255,255,255,0.02)] rounded-xl border border-[rgba(255,255,255,0.04)] p-4">
                <div class="flex items-center gap-2 mb-6">
                  <div class="w-6 h-6 rounded-md bg-[#0a84ff]/20"></div>
                  <div class="h-2 w-16 rounded bg-[rgba(255,255,255,0.1)]"></div>
                </div>
                @for (item of ['Dashboard','Polisy','Szkody','Dokumenty','Ustawienia']; track item; let i = $index) {
                  <div class="flex items-center gap-2.5 px-2.5 py-2 rounded-lg mb-0.5"
                       [style.background]="i === 0 ? 'rgba(10,132,255,0.1)' : 'transparent'">
                    <div class="w-3.5 h-3.5 rounded"
                         [style.background]="i === 0 ? '#0a84ff' : 'rgba(255,255,255,0.08)'"></div>
                    <div class="h-1.5 rounded-full"
                         [style.width]="(50 + i * 10) + '%'"
                         [style.background]="i === 0 ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.06)'"></div>
                  </div>
                }
              </div>
              <div class="flex-1 flex flex-col gap-4">
                <div class="flex items-center justify-between">
                  <div class="h-2.5 w-24 rounded bg-[rgba(255,255,255,0.1)]"></div>
                  <div class="flex gap-2">
                    <div class="w-7 h-7 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.04)]"></div>
                    <div class="w-7 h-7 rounded-full bg-[rgba(10,132,255,0.15)]"></div>
                  </div>
                </div>
                <div class="grid grid-cols-3 gap-3">
                  <div class="bg-[rgba(255,255,255,0.02)] rounded-xl border border-[rgba(255,255,255,0.04)] p-3 md:p-4">
                    <div class="w-5 h-5 rounded-md mb-2 bg-[#0a84ff18]"></div>
                    <div class="text-[clamp(16px,2vw,24px)] font-bold text-[#0a84ff]">3</div>
                    <div class="h-1.5 w-16 mt-1 rounded bg-[rgba(255,255,255,0.05)]"></div>
                  </div>
                  <div class="bg-[rgba(255,255,255,0.02)] rounded-xl border border-[rgba(255,255,255,0.04)] p-3 md:p-4">
                    <div class="w-5 h-5 rounded-md mb-2 bg-[#ff9f0a18]"></div>
                    <div class="text-[clamp(16px,2vw,24px)] font-bold text-[#ff9f0a]">1</div>
                    <div class="h-1.5 w-16 mt-1 rounded bg-[rgba(255,255,255,0.05)]"></div>
                  </div>
                  <div class="bg-[rgba(255,255,255,0.02)] rounded-xl border border-[rgba(255,255,255,0.04)] p-3 md:p-4">
                    <div class="w-5 h-5 rounded-md mb-2 bg-[#30d15818]"></div>
                    <div class="text-[clamp(16px,2vw,24px)] font-bold text-[#30d158]">450k</div>
                    <div class="h-1.5 w-16 mt-1 rounded bg-[rgba(255,255,255,0.05)]"></div>
                  </div>
                </div>
                <div class="flex-1 bg-[rgba(255,255,255,0.02)] rounded-xl border border-[rgba(255,255,255,0.04)] p-4 flex flex-col">
                  <div class="flex items-center justify-between mb-4">
                    <div class="h-2 w-20 rounded bg-[rgba(255,255,255,0.08)]"></div>
                    <div class="flex gap-2">
                      @for (t of ['1M','3M','1R']; track t) {
                        <div class="px-2 py-0.5 rounded text-[9px] text-[#6e6e73] bg-[rgba(255,255,255,0.03)]">{{ t }}</div>
                      }
                    </div>
                  </div>
                  <div class="flex-1 flex items-end gap-[3px]">
                    @for (h of animatedChartBars; track $index) {
                      <div class="flex-1 rounded-t"
                           [style.height]="h + '%'"
                           [style.background]="'linear-gradient(to top, #0a84ff, #409cff)'"
                           [style.opacity]="0.3 + (h / 100) * 0.7"
                           style="transition: height 0.15s ease-out, opacity 0.15s ease-out"></div>
                    }
                  </div>
                </div>
              </div>
            </div>
            <div class="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(10,132,255,0.06),transparent_60%)]"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats -->
    <section id="szkody" class="scroll-snap-section relative z-10 bg-black py-32 px-6">
      <div class="max-w-[1120px] mx-auto">
        <div class="text-center mb-16 fade-in">
          <h2 class="text-4xl md:text-5xl font-bold tracking-tight text-white">Zaufali nam tysiące klientów</h2>
        </div>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-8">
          <div class="text-center fade-in flex flex-col items-center" style="transition-delay: 0ms">
            <div class="relative w-32 h-32 mb-4">
              <svg class="transform -rotate-90" width="128" height="128">
                <circle cx="64" cy="64" r="56" stroke="rgba(255,255,255,0.05)" stroke-width="8" fill="none"/>
                <circle class="progress-ring" cx="64" cy="64" r="56" stroke="#0a84ff" stroke-width="8" fill="none"
                        stroke-dasharray="352" stroke-dashoffset="0" id="ring-0"/>
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-2xl font-bold text-white" id="stat-0">0+</div>
              </div>
            </div>
            <p class="text-[#86868b] text-sm">Aktywnych klientów</p>
          </div>
          <div class="text-center fade-in flex flex-col items-center" style="transition-delay: 100ms">
            <div class="relative w-32 h-32 mb-4">
              <svg class="transform -rotate-90" width="128" height="128">
                <circle cx="64" cy="64" r="56" stroke="rgba(255,255,255,0.05)" stroke-width="8" fill="none"/>
                <circle class="progress-ring" cx="64" cy="64" r="56" stroke="#30d158" stroke-width="8" fill="none"
                        stroke-dasharray="352" stroke-dashoffset="0" id="ring-1"/>
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-2xl font-bold text-white" id="stat-1">0%</div>
              </div>
            </div>
            <p class="text-[#86868b] text-sm">Zadowolonych użytkowników</p>
          </div>
          <div class="text-center fade-in flex flex-col items-center" style="transition-delay: 200ms">
            <div class="relative w-32 h-32 mb-4">
              <svg class="transform -rotate-90" width="128" height="128">
                <circle cx="64" cy="64" r="56" stroke="rgba(255,255,255,0.05)" stroke-width="8" fill="none"/>
                <circle class="progress-ring" cx="64" cy="64" r="56" stroke="#ff9f0a" stroke-width="8" fill="none"
                        stroke-dasharray="352" stroke-dashoffset="0" id="ring-2"/>
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-2xl font-bold text-white" id="stat-2">0+</div>
              </div>
            </div>
            <p class="text-[#86868b] text-sm">Polis wystawionych</p>
          </div>
          <div class="text-center fade-in flex flex-col items-center" style="transition-delay: 300ms">
            <div class="relative w-32 h-32 mb-4">
              <svg class="transform -rotate-90" width="128" height="128">
                <circle cx="64" cy="64" r="56" stroke="rgba(255,255,255,0.05)" stroke-width="8" fill="none"/>
                <circle class="progress-ring" cx="64" cy="64" r="56" stroke="#bf5af2" stroke-width="8" fill="none"
                        stroke-dasharray="352" stroke-dashoffset="0" id="ring-3"/>
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-2xl font-bold text-white" id="stat-3">0 min</div>
              </div>
            </div>
            <p class="text-[#86868b] text-sm">Średni czas obsługi szkody</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Horizontal Scroll Section -->
    <section class="horizontal-scroll-wrapper relative z-10 bg-black py-20 overflow-hidden">
      <div class="horizontal-scroll-content flex gap-8 px-6">
        @for (benefit of ['Błyskawiczne wypłaty', 'Wsparcie 24/7', 'Bez ukrytych opłat', 'Prosta rejestracja', 'Elastyczne warunki', 'Pełna transparentność']; track benefit) {
          <div class="horizontal-card card-shine flex-shrink-0 w-80 bg-[#111112] rounded-2xl border border-[rgba(255,255,255,0.05)] p-8 hover:border-[rgba(10,132,255,0.3)] transition-all glass">
            <div class="w-12 h-12 rounded-xl bg-[#0a84ff18] flex items-center justify-center mb-4 floating bounce-hover">
              <svg class="w-6 h-6 text-[#0a84ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <h3 class="text-xl font-bold text-white mb-2">{{ benefit }}</h3>
            <p class="text-sm text-[#86868b]">Lorem ipsum dolor sit amet consectetur adipisicing elit. Explicabo, quas.</p>
          </div>
        }
      </div>
    </section>

    <!-- CTA -->
    <section id="kontakt" class="scroll-snap-section relative z-10 bg-black py-40 px-6 overflow-hidden">
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[radial-gradient(circle,rgba(0,113,227,0.12)_0%,transparent_70%)]"></div>

      <!-- Morphing shapes decoration -->
      <div class="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-[#0a84ff]/10 to-[#30d158]/10 morph blur-2xl"></div>
      <div class="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-[#ff9f0a]/10 to-[#bf5af2]/10 morph blur-2xl" style="animation-delay: 2s"></div>

      <div class="relative z-10 max-w-3xl mx-auto text-center fade-in">
        <h2 class="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6">Gotowy na spokój ducha?</h2>
        <p class="text-lg text-[#86868b] mb-10 max-w-xl mx-auto leading-relaxed">
          Dołącz do tysięcy klientów, którzy wybrali proste i przejrzyste ubezpieczenie. Uzyskaj wycenę w mniej niż 2 minuty.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          @if (isLoggedIn()) {
            <a routerLink="/dashboard"
               class="magnetic-btn inline-flex items-center justify-center rounded-full bg-[#0071e3] px-10 py-4 text-lg font-medium text-white hover:bg-[#0077ed] transition-colors">
              Przejdź do panelu
            </a>
          } @else {
            <a routerLink="/register"
               class="magnetic-btn inline-flex items-center justify-center rounded-full bg-[#0071e3] px-10 py-4 text-lg font-medium text-white hover:bg-[#0077ed] transition-colors">
              Uzyskaj wycenę
            </a>
          }
          <a href="tel:800123456"
             class="magnetic-btn inline-flex items-center justify-center rounded-full border border-[#424245] px-10 py-4 text-lg font-medium text-[#d1d1d6] hover:border-[#6e6e73] hover:text-white transition-colors">
            Zadzwoń: 800 123 456
          </a>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="relative z-10 bg-[#1d1d1f] border-t border-[#2d2d2d]">
      <div class="max-w-[1120px] mx-auto px-6 py-16">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          <div>
            <p class="text-white font-semibold text-sm mb-4">🛡️ ABC Insurance</p>
            <p class="text-[#6e6e73] text-xs leading-relaxed">System zarządzania polisami i szkodami ubezpieczeniowymi nowej generacji.</p>
          </div>
          <div>
            <p class="text-[#86868b] text-xs font-semibold uppercase tracking-widest mb-4">Produkty</p>
            <ul class="space-y-2">
              @for (l of ['Komunikacyjne','Nieruchomości','Zdrowotne','Na życie','Podróżne','OC zawodowe']; track l) {
                <li><a href="#" class="text-[#6e6e73] text-xs hover:text-white transition-colors">{{ l }}</a></li>
              }
            </ul>
          </div>
          <div>
            <p class="text-[#86868b] text-xs font-semibold uppercase tracking-widest mb-4">Firma</p>
            <ul class="space-y-2">
              @for (l of ['O nas','Kariera','Aktualności','Partnerzy']; track l) {
                <li><a href="#" class="text-[#6e6e73] text-xs hover:text-white transition-colors">{{ l }}</a></li>
              }
            </ul>
          </div>
          <div>
            <p class="text-[#86868b] text-xs font-semibold uppercase tracking-widest mb-4">Pomoc</p>
            <ul class="space-y-2">
              @for (l of ['Centrum pomocy','Kontakt','FAQ','Regulamin']; track l) {
                <li><a href="#" class="text-[#6e6e73] text-xs hover:text-white transition-colors">{{ l }}</a></li>
              }
            </ul>
          </div>
        </div>
        <div class="border-t border-[#2d2d2d] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p class="text-[#6e6e73] text-xs">&copy; 2026 ABC Insurance. Wszelkie prawa zastrzeżone.</p>
          <div class="flex gap-6">
            @for (t of ['Polityka prywatności','Regulamin','Pliki cookie']; track t) {
              <a href="#" class="text-[#6e6e73] text-xs hover:text-white transition-colors">{{ t }}</a>
            }
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    /* Noise Overlay */
    .noise-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9998;
      opacity: 0.03;
      background-image: url('data:image/svg+xml,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noise"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" /%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noise)" /%3E%3C/svg%3E');
      animation: grain 8s steps(10) infinite;
    }

    @keyframes grain {
      0%, 100% { transform: translate(0, 0); }
      10% { transform: translate(-5%, -10%); }
      20% { transform: translate(-15%, 5%); }
      30% { transform: translate(7%, -25%); }
      40% { transform: translate(-5%, 25%); }
      50% { transform: translate(-15%, 10%); }
      60% { transform: translate(15%, 0%); }
      70% { transform: translate(0%, 15%); }
      80% { transform: translate(3%, 35%); }
      90% { transform: translate(-10%, 10%); }
    }

    /* Hero Animations */
    .hero-content {
      animation: heroFadeIn 1s ease-out 0.8s both;
    }
    @keyframes heroFadeIn {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .scroll-dot {
      animation: scrollBounce 1.8s ease-in-out infinite;
    }
    @keyframes scrollBounce {
      0%, 100% { transform: translateY(0); opacity: 1; }
      50% { transform: translateY(8px); opacity: 0.3; }
    }

    /* Feature Cards */
    .feature-spotlight {
      background: radial-gradient(400px circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.03), transparent 50%);
    }

    .tilt-card {
      transform-style: preserve-3d;
      transition: transform 0.2s ease-out;
    }

    /* Floating Animation */
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }

    .floating {
      animation: float 3s ease-in-out infinite;
    }

    /* Ripple Effect */
    @keyframes ripple-expand {
      from {
        transform: scale(1);
        opacity: 1;
      }
      to {
        transform: scale(50);
        opacity: 0;
      }
    }

    /* Fade In */
    .fade-in {
      opacity: 0;
      transform: translateY(30px);
      transition: opacity 0.8s ease-out, transform 0.8s ease-out;
    }

    .fade-in.visible {
      opacity: 1;
      transform: translateY(0);
    }

    /* Progress Rings */
    .progress-ring {
      transition: stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1);
      stroke-linecap: round;
    }

    /* Horizontal Scroll */
    .horizontal-scroll-wrapper {
      overflow-x: auto;
      overflow-y: hidden;
      scroll-snap-type: x mandatory;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: thin;
      scrollbar-color: rgba(10, 132, 255, 0.3) transparent;
    }

    .horizontal-scroll-wrapper::-webkit-scrollbar {
      height: 8px;
    }

    .horizontal-scroll-wrapper::-webkit-scrollbar-track {
      background: transparent;
    }

    .horizontal-scroll-wrapper::-webkit-scrollbar-thumb {
      background: rgba(10, 132, 255, 0.3);
      border-radius: 4px;
    }

    .horizontal-scroll-wrapper::-webkit-scrollbar-thumb:hover {
      background: rgba(10, 132, 255, 0.5);
    }

    .horizontal-card {
      scroll-snap-align: start;
    }

    /* Magnetic Buttons */
    .magnetic-btn {
      transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      will-change: transform;
    }

    /* Glassmorphism */
    .glass {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: saturate(180%) blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    /* Glitch Effect */
    @keyframes glitch {
      0% {
        transform: translate(0);
      }
      20% {
        transform: translate(-2px, 2px);
      }
      40% {
        transform: translate(-2px, -2px);
      }
      60% {
        transform: translate(2px, 2px);
      }
      80% {
        transform: translate(2px, -2px);
      }
      100% {
        transform: translate(0);
      }
    }

    .glitch:hover {
      animation: glitch 0.3s infinite;
    }

    /* Morphing Shapes */
    @keyframes morph {
      0%, 100% {
        border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
      }
      50% {
        border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
      }
    }

    .morph {
      animation: morph 8s ease-in-out infinite;
    }

    /* Custom Cursor */
    * {
      cursor: none !important;
    }

    .cursor-grabbing {
      cursor: grabbing !important;
    }

    /* Scale Parallax */
    .scale-parallax {
      transition: transform 0.3s ease-out;
    }

    /* Scroll Snap */
    .scroll-snap-section {
      scroll-snap-align: start;
      scroll-snap-stop: always;
    }

    html {
      scroll-snap-type: y proximity;
    }

    /* Shimmer Effect for Skeleton */
    @keyframes shimmer {
      0% {
        background-position: -1000px 0;
      }
      100% {
        background-position: 1000px 0;
      }
    }

    .skeleton {
      background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.02) 0%,
        rgba(255, 255, 255, 0.08) 50%,
        rgba(255, 255, 255, 0.02) 100%
      );
      background-size: 1000px 100%;
      animation: shimmer 2s infinite;
    }

    /* Additional Glassmorphism */
    .glass-strong {
      background: rgba(17, 17, 18, 0.7);
      backdrop-filter: saturate(180%) blur(30px);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    /* Glow on Hover */
    .glow-hover {
      position: relative;
      transition: all 0.3s ease;
    }

    .glow-hover::before {
      content: '';
      position: absolute;
      inset: -2px;
      border-radius: inherit;
      background: linear-gradient(45deg, #0a84ff, #30d158, #ff9f0a, #bf5af2);
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: -1;
      filter: blur(10px);
    }

    .glow-hover:hover::before {
      opacity: 0.7;
    }

    /* Pulse Animation */
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0.8;
        transform: scale(1.05);
      }
    }

    .pulse {
      animation: pulse 2s ease-in-out infinite;
    }

    /* Gradient Text Animation */
    @keyframes gradient-shift {
      0% {
        background-position: 0% 50%;
      }
      50% {
        background-position: 100% 50%;
      }
      100% {
        background-position: 0% 50%;
      }
    }

    .gradient-text {
      animation: gradient-shift 3s ease infinite;
    }

    /* Progressive Image Reveal */
    .reveal-image {
      position: relative;
      overflow: hidden;
    }

    .reveal-image::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, #000, transparent);
      transform: translateX(-100%);
      transition: transform 0.8s ease;
    }

    .reveal-image.revealed::after {
      transform: translateX(100%);
    }

    /* Bounce on Hover */
    @keyframes bounce-hover {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-5px);
      }
    }

    .bounce-hover:hover {
      animation: bounce-hover 0.5s ease;
    }

    /* Rotate on Scroll */
    .rotate-scroll {
      transition: transform 0.3s ease-out;
    }

    /* Text Shadow Glow */
    .text-glow {
      text-shadow: 0 0 20px rgba(10, 132, 255, 0.5),
                   0 0 40px rgba(10, 132, 255, 0.3);
    }

    /* Card Shine Effect */
    .card-shine {
      position: relative;
      overflow: hidden;
    }

    .card-shine::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(
        45deg,
        transparent,
        rgba(255, 255, 255, 0.05),
        transparent
      );
      transform: rotate(45deg);
      transition: all 0.6s ease;
    }

    .card-shine:hover::before {
      left: 100%;
    }
  `]
})
export class LandingComponent implements AfterViewInit, OnDestroy {
  private auth = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  private renderer = inject(Renderer2);

  @ViewChild('heroVideo') heroVideoRef!: ElementRef<HTMLVideoElement>;

  features = features;
  slides = slides;
  chartBars = chartBars;

  scrolled = false;
  scrollProgress = 0;
  mobileMenuOpen = false;
  animatedChartBars = [...chartBars];

  readonly revealWords = 'Wierzymy, że ubezpieczenie powinno być proste, przejrzyste i zawsze dostępne — wtedy, kiedy tego najbardziej potrzebujesz.'.split(' ');
  revealOpacities: number[] = this.revealWords.map(() => 0.08);

  readonly user = this.auth.user;
  readonly isLoggedIn = this.auth.isLoggedIn;

  private observers: IntersectionObserver[] = [];
  private particles: Array<{x: number, y: number, vx: number, vy: number, size: number, opacity: number}> = [];
  private particleCanvas?: HTMLCanvasElement;
  private particleCtx?: CanvasRenderingContext2D;
  private particleAnimationId?: number;
  private customCursor?: HTMLElement;
  private cursorTrail: Array<{x: number, y: number}> = [];
  private smoothScrollTarget = 0;
  private smoothScrollCurrent = 0;
  private smoothScrollRaf?: number;

  @HostListener('window:scroll')
  onScroll() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    this.scrollProgress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    this.scrolled = scrollTop > 60;
    this.updateTextReveal();
    this.updatePhoneSpin();
    this.updateChartBars(scrollTop);
    this.updateParallax(scrollTop);
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
    this.updateCustomCursor(e);
    this.updateMagneticButtons(e);
  }

  @HostListener('document:click', ['$event'])
  onClick(e: MouseEvent) {
    this.createRipple(e);
  }

  private updatePhoneSpin() {
    const section = document.getElementById('polisy');
    const phone = document.getElementById('phone-spin');
    const front = document.getElementById('phone-front');
    const back = document.getElementById('phone-back');
    if (!section || !phone) return;

    const rect = section.getBoundingClientRect();
    const wh = window.innerHeight;

    // progress 0→1 gdy sekcja przewija się przez viewport
    const start = rect.top - wh;
    const end = rect.bottom;
    const progress = Math.max(0, Math.min(1, -start / (end - start)));

    // lekkie przechylenie ±45° — przód zawsze widoczny (tył nigdy nie jest pokazywany)
    const deg = (progress - 0.5) * 90;
    phone.style.transform = `rotateY(${deg}deg)`;
    phone.style.transition = 'transform 0.05s linear';
  }

  private updateChartBars(scrollTop: number) {
    const phase = scrollTop * 0.012;
    this.animatedChartBars = chartBars.map((base, i) => {
      const wave = Math.sin(phase + i * 0.6) * 18;
      return Math.max(10, Math.min(100, base + wave));
    });
  }

  private updateTextReveal() {
    const section = document.getElementById('text-reveal');
    if (!section) return;
    const rect = section.getBoundingClientRect();
    const wh = window.innerHeight;
    // start: sekcja wchodzi na 75% viewportu; end: sekcja wychodzi na 35% viewportu
    const start = rect.top - wh * 0.75;
    const end = rect.bottom - wh * 0.35;
    const progress = end > start ? Math.max(0, Math.min(1, -start / (end - start))) : 0;
    const n = this.revealWords.length;
    this.revealOpacities = this.revealWords.map((_, i) => {
      const wStart = i / n;
      const wEnd = (i + 1) / n;
      if (progress <= wStart) return 0.08;
      if (progress >= wEnd) return 1;
      return 0.08 + 0.92 * (progress - wStart) / (wEnd - wStart);
    });
  }

  logout() {
    this.auth.logout();
  }

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    // Wymuś odtwarzanie wideo (Chrome wymaga tego po muted)
    const video = this.heroVideoRef?.nativeElement;
    if (video) {
      video.muted = true;
      video.play().catch(() => {});
    }

    // Initialize all new effects
    this.initParticles();
    this.initCustomCursor();
    this.initMeshGradient();
    this.initFloatingElements();
    this.initScaleParallax();
    this.initHorizontalScroll();
    this.initProgressiveReveal();
    // this.initSmoothScroll(); // Disabled by default - can be jarring

    // Efekt budowania z kwadratów
    this.initTileEffect();

    setTimeout(() => {
    // Fade-in on scroll
    const fadeObserver = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.05 }
    );
    document.querySelectorAll('.fade-in').forEach(el => fadeObserver.observe(el));
    this.observers.push(fadeObserver);

    // Stats counter
    const statsEl = document.querySelector('#szkody');
    if (statsEl) {
      const statsObserver = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            this.animateCounters();
            statsObserver.disconnect();
          }
        },
        { threshold: 0.3 }
      );
      statsObserver.observe(statsEl);
      this.observers.push(statsObserver);
    }

    // Mouse spotlight on feature cards
    const grid = document.getElementById('features-grid');
    if (grid) {
      grid.addEventListener('mousemove', (e: MouseEvent) => {
        grid.querySelectorAll<HTMLElement>('.feature-card').forEach(card => {
          const rect = card.getBoundingClientRect();
          card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
          card.style.setProperty('--my', `${e.clientY - rect.top}px`);
        });
      });
    }
    }, 0); // setTimeout end
  }

  private initTileEffect() {
    const grid = document.getElementById('tile-grid');
    if (!grid) return;

    const tileSize = 80; // px — rozmiar kafla
    const cols = Math.ceil(window.innerWidth / tileSize);
    const rows = Math.ceil(window.innerHeight / tileSize);
    const tiles: HTMLElement[] = [];

    // Utwórz siatkę kafli
    grid.style.cssText = `display:grid;grid-template-columns:repeat(${cols},${tileSize}px);grid-template-rows:repeat(${rows},${tileSize}px);`;

    for (let i = 0; i < cols * rows; i++) {
      const tile = document.createElement('div');
      tile.style.cssText = `background:#000;transition:opacity 0.4s ease, transform 0.4s ease;`;
      grid.appendChild(tile);
      tiles.push(tile);
    }

    // Tasuj losowo i usuń kafle jeden po drugim
    const shuffled = [...tiles].sort(() => Math.random() - 0.5);
    const batchSize = 6;
    let idx = 0;

    const removeBatch = () => {
      for (let b = 0; b < batchSize && idx < shuffled.length; b++, idx++) {
        const tile = shuffled[idx];
        tile.style.opacity = '0';
        tile.style.transform = 'scale(0.8)';
      }
      if (idx < shuffled.length) {
        setTimeout(removeBatch, 40);
      } else {
        setTimeout(() => grid.remove(), 500);
      }
    };

    // Zacznij po krótkim opóźnieniu
    setTimeout(removeBatch, 300);
  }

  private animateCounters() {
    const counters = [
      { id: 'stat-0', ringId: 'ring-0', value: 12500, suffix: '+', percent: 75 },
      { id: 'stat-1', ringId: 'ring-1', value: 98, suffix: '%', percent: 98 },
      { id: 'stat-2', ringId: 'ring-2', value: 45000, suffix: '+', percent: 85 },
      { id: 'stat-3', ringId: 'ring-3', value: 15, suffix: ' min', percent: 60 },
    ];
    counters.forEach(c => {
      const el = document.getElementById(c.id);
      const ringElement = document.getElementById(c.ringId);
      if (!el || !ringElement) return;

      const ring = ringElement as unknown as SVGCircleElement;
      const circumference = 2 * Math.PI * 56; // r=56
      const start = performance.now();
      const duration = 2000;

      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        const v = Math.round(eased * c.value);
        el.textContent = v >= 1000 ? `${Math.round(v / 1000)}k${c.suffix}` : `${v.toLocaleString('pl')}${c.suffix}`;

        // Animate ring
        const offset = circumference - (eased * c.percent / 100) * circumference;
        ring.style.strokeDashoffset = offset.toString();

        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  // ===== PARTICLE SYSTEM =====
  private initParticles() {
    const canvas = document.createElement('canvas');
    canvas.className = 'particle-canvas';
    canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:5;';

    const hero = document.querySelector('section');
    if (hero) {
      hero.appendChild(canvas);
      this.particleCanvas = canvas;
      this.particleCtx = canvas.getContext('2d')!;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Create particles
      for (let i = 0; i < 80; i++) {
        this.particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 2 + 0.5,
          opacity: Math.random() * 0.5 + 0.2
        });
      }

      this.animateParticles();
    }
  }

  private animateParticles() {
    if (!this.particleCanvas || !this.particleCtx) return;

    const ctx = this.particleCtx;
    const canvas = this.particleCanvas;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(100, 210, 255, ${p.opacity})`;
      ctx.fill();
    });

    // Draw connections
    this.particles.forEach((p1, i) => {
      this.particles.slice(i + 1).forEach(p2 => {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(64, 156, 255, ${(1 - dist / 120) * 0.15})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      });
    });

    this.particleAnimationId = requestAnimationFrame(() => this.animateParticles());
  }

  // ===== CUSTOM CURSOR =====
  private initCustomCursor() {
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    cursor.style.cssText = `
      position: fixed;
      width: 40px;
      height: 40px;
      border: 2px solid rgba(10, 132, 255, 0.6);
      border-radius: 50%;
      pointer-events: none;
      z-index: 10000;
      transition: transform 0.15s ease, opacity 0.3s ease;
      mix-blend-mode: difference;
    `;
    document.body.appendChild(cursor);
    this.customCursor = cursor;

    // Add trail dots
    for (let i = 0; i < 5; i++) {
      this.cursorTrail.push({x: 0, y: 0});
    }
  }

  private updateCustomCursor(e: MouseEvent) {
    if (!this.customCursor) return;

    const x = e.clientX;
    const y = e.clientY;

    this.customCursor.style.left = `${x - 20}px`;
    this.customCursor.style.top = `${y - 20}px`;

    // Check if hovering over interactive element
    const target = e.target as HTMLElement;
    if (target.tagName === 'A' || target.tagName === 'BUTTON') {
      this.customCursor.style.transform = 'scale(1.5)';
      this.customCursor.style.borderColor = 'rgba(48, 209, 88, 0.8)';
    } else {
      this.customCursor.style.transform = 'scale(1)';
      this.customCursor.style.borderColor = 'rgba(10, 132, 255, 0.6)';
    }
  }

  // ===== MAGNETIC BUTTONS =====
  private updateMagneticButtons(e: MouseEvent) {
    const buttons = document.querySelectorAll<HTMLElement>('.magnetic-btn');

    buttons.forEach(btn => {
      const rect = btn.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 150) {
        const strength = (150 - distance) / 150;
        const moveX = dx * strength * 0.3;
        const moveY = dy * strength * 0.3;
        btn.style.transform = `translate(${moveX}px, ${moveY}px)`;
      } else {
        btn.style.transform = 'translate(0, 0)';
      }
    });
  }

  // ===== RIPPLE EFFECT =====
  private createRipple(e: MouseEvent) {
    const ripple = document.createElement('div');
    ripple.className = 'ripple-effect';
    ripple.style.cssText = `
      position: fixed;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(10, 132, 255, 0.4), transparent);
      pointer-events: none;
      z-index: 9999;
      animation: ripple-expand 0.6s ease-out forwards;
    `;
    ripple.style.left = `${e.clientX - 10}px`;
    ripple.style.top = `${e.clientY - 10}px`;

    document.body.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
  }

  // ===== PARALLAX =====
  private updateParallax(scrollTop: number) {
    const parallaxElements = document.querySelectorAll<HTMLElement>('.parallax-layer');

    parallaxElements.forEach(el => {
      const speed = parseFloat(el.dataset['speed'] || '0.5');
      const yPos = -(scrollTop * speed);
      el.style.transform = `translateY(${yPos}px)`;
    });
  }

  // ===== SMOOTH SCROLL =====
  private initSmoothScroll() {
    document.documentElement.style.scrollBehavior = 'auto';

    window.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.smoothScrollTarget += e.deltaY;
      this.smoothScrollTarget = Math.max(0, Math.min(this.smoothScrollTarget, document.documentElement.scrollHeight - window.innerHeight));
    }, { passive: false });

    this.updateSmoothScroll();
  }

  private updateSmoothScroll() {
    this.smoothScrollCurrent += (this.smoothScrollTarget - this.smoothScrollCurrent) * 0.1;
    window.scrollTo(0, this.smoothScrollCurrent);

    this.smoothScrollRaf = requestAnimationFrame(() => this.updateSmoothScroll());
  }

  // ===== MESH GRADIENT =====
  private initMeshGradient() {
    const meshCanvas = document.createElement('canvas');
    meshCanvas.className = 'mesh-gradient';
    meshCanvas.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
      opacity: 0.3;
      pointer-events: none;
    `;

    const hero = document.querySelector('section');
    if (hero) {
      hero.insertBefore(meshCanvas, hero.firstChild);

      meshCanvas.width = window.innerWidth;
      meshCanvas.height = window.innerHeight;

      const ctx = meshCanvas.getContext('2d')!;
      let time = 0;

      const animate = () => {
        time += 0.005;

        ctx.clearRect(0, 0, meshCanvas.width, meshCanvas.height);

        const gradient = ctx.createRadialGradient(
          meshCanvas.width / 2 + Math.sin(time) * 200,
          meshCanvas.height / 2 + Math.cos(time * 0.8) * 150,
          0,
          meshCanvas.width / 2,
          meshCanvas.height / 2,
          meshCanvas.width / 2
        );

        gradient.addColorStop(0, 'rgba(10, 132, 255, 0.4)');
        gradient.addColorStop(0.5, 'rgba(48, 209, 88, 0.2)');
        gradient.addColorStop(1, 'rgba(255, 159, 10, 0.1)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, meshCanvas.width, meshCanvas.height);

        requestAnimationFrame(animate);
      };

      animate();
    }
  }

  // ===== FLOATING ELEMENTS =====
  private initFloatingElements() {
    const floatingEls = document.querySelectorAll<HTMLElement>('.floating');

    floatingEls.forEach((el, i) => {
      const duration = 3 + Math.random() * 2;
      const delay = i * 0.2;
      el.style.animation = `float ${duration}s ease-in-out ${delay}s infinite`;
    });
  }

  // ===== TEXT EFFECTS =====
  private initTextScramble(element: HTMLElement, finalText: string) {
    const chars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    let iteration = 0;

    const interval = setInterval(() => {
      element.textContent = finalText
        .split('')
        .map((char, index) => {
          if (index < iteration) {
            return finalText[index];
          }
          return chars[Math.floor(Math.random() * chars.length)];
        })
        .join('');

      if (iteration >= finalText.length) {
        clearInterval(interval);
      }

      iteration += 1 / 3;
    }, 30);
  }

  // ===== 3D TILT CARDS =====
  onCardMouseMove(e: MouseEvent) {
    const card = e.currentTarget as HTMLElement;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
  }

  onCardMouseLeave(e: MouseEvent) {
    const card = e.currentTarget as HTMLElement;
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  }

  // ===== SCALE PARALLAX =====
  private initScaleParallax() {
    const scaleElements = document.querySelectorAll<HTMLElement>('.scale-parallax');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const rect = entry.boundingClientRect;
            const windowHeight = window.innerHeight;
            const elementCenter = rect.top + rect.height / 2;
            const distanceFromCenter = Math.abs(windowHeight / 2 - elementCenter);
            const scale = 1 - (distanceFromCenter / windowHeight) * 0.15;

            (entry.target as HTMLElement).style.transform = `scale(${Math.max(0.85, Math.min(1, scale))})`;
          }
        });
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    scaleElements.forEach(el => observer.observe(el));
    this.observers.push(observer);
  }

  // ===== TYPEWRITER EFFECT =====
  private initTypewriter(element: HTMLElement, text: string, speed: number = 50) {
    let i = 0;
    element.textContent = '';

    const type = () => {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
        setTimeout(type, speed);
      }
    };

    type();
  }

  // ===== SPLIT TEXT REVEAL =====
  private initSplitTextReveal(element: HTMLElement) {
    const text = element.textContent || '';
    element.textContent = '';

    const chars = text.split('');
    chars.forEach((char, i) => {
      const span = document.createElement('span');
      span.textContent = char;
      span.style.cssText = `
        display: inline-block;
        opacity: 0;
        transform: translateY(20px);
        animation: charReveal 0.5s ease forwards;
        animation-delay: ${i * 0.03}s;
      `;
      element.appendChild(span);
    });

    const style = document.createElement('style');
    style.textContent = `
      @keyframes charReveal {
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
  }

  // ===== HORIZONTAL SCROLL ANIMATION =====
  private initHorizontalScroll() {
    const wrapper = document.querySelector('.horizontal-scroll-wrapper');
    if (!wrapper) return;

    let isDown = false;
    let startX: number;
    let scrollLeft: number;

    wrapper.addEventListener('mousedown', (e: Event) => {
      isDown = true;
      wrapper.classList.add('cursor-grabbing');
      startX = (e as MouseEvent).pageX - wrapper.getBoundingClientRect().left;
      scrollLeft = wrapper.scrollLeft;
    });

    wrapper.addEventListener('mouseleave', () => {
      isDown = false;
      wrapper.classList.remove('cursor-grabbing');
    });

    wrapper.addEventListener('mouseup', () => {
      isDown = false;
      wrapper.classList.remove('cursor-grabbing');
    });

    wrapper.addEventListener('mousemove', (e: Event) => {
      if (!isDown) return;
      e.preventDefault();
      const x = (e as MouseEvent).pageX - wrapper.getBoundingClientRect().left;
      const walk = (x - startX) * 2;
      wrapper.scrollLeft = scrollLeft - walk;
    });
  }

  // ===== PROGRESSIVE IMAGE REVEAL =====
  private initProgressiveReveal() {
    const revealElements = document.querySelectorAll<HTMLElement>('.reveal-image');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    revealElements.forEach(el => observer.observe(el));
    this.observers.push(observer);
  }

  ngOnDestroy() {
    this.observers.forEach(o => o.disconnect());
    if (this.particleAnimationId) cancelAnimationFrame(this.particleAnimationId);
    if (this.smoothScrollRaf) cancelAnimationFrame(this.smoothScrollRaf);
    if (this.customCursor) this.customCursor.remove();
  }
}
