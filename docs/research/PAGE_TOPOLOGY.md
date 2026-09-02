# Page Topology & Assembly Blueprint

Target: https://turvo.com/ (Home Page)

## Section Order & Layout

1. **Top Notice Bar** (`<TopBar />`)
   - Type: Static header bar
   - Height: 44px
   - Background: Dark (`#18171d`)
   - Sticky context: Precedes navbar

2. **Main Header Navbar** (`<Navbar />`)
   - Type: Sticky header with backdrop-blur & scroll state
   - Height: 80px
   - Z-Index: 50
   - Features: Logo, Mega menus (`<MegaMenuProduct />`, `<MegaMenuResources />`, `<MegaMenuCompany />`), Schedule Demo CTA, Search Modal trigger, Mobile Hamburger trigger

3. **Hero Section** (`<HeroSection />`)
   - Type: 2-column flex/grid container
   - Padding: 80px 0
   - Left: Eyebrow, H1, Subtext, Demo CTA
   - Right: Interactive Screen/Video preview mockup

4. **Who Turvo Powers** (`<WhoTurvoPowers />`)
   - Type: 4-card grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`)
   - Subtitle & H2
   - Aspect ratio: Tall cards (min-height 420px)
   - Background zoom effect on hover

5. **Collaboration Cloud Features** (`<CollaborationCloud />`)
   - Type: 3 alternating rows (`flex flex-col lg:flex-row` and `lg:flex-row-reverse`)
   - Row 1: Collaboration Cloud
   - Row 2: TMS Execution
   - Row 3: Grow ROI

6. **Partner Logo Marquee** (`<LogoMarquee />`)
   - Type: Full-width continuous linear loop
   - Logos: 11 partner logos duplicated for seamless looping

7. **Transportation Toolbox** (`<TransportationToolbox />`)
   - Type: 6-card grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)
   - Features custom proprietary Turvo badge SVGs
   - Bottom centered CTA button

8. **Customer Video Spotlight** (`<CustomerVideoSpotlight />`)
   - Type: 2-column layout (Headline + Video Thumbnail with Play Button)
   - Interactive Lightbox modal opening YouTube video

9. **Next Step Call To Action** (`<NextStepCTA />`)
   - Type: Full-width dark hero CTA banner

10. **Newsletter Subscription** (`<SubscribeSection />`)
    - Type: Gradient section with email form

11. **Latest Articles** (`<LatestArticles />`)
    - Type: 3-column article cards with thumbnail hover animations

12. **Footer** (`<Footer />`)
    - Type: 4-column navigation + bottom copyright and social icons
