import { NextResponse } from 'next/server';
import { Page, SectionInstance } from '@/types/page-builder';

// Mock Database
const MOCK_PAGES: Record<string, Page> = {
  home: {
    id: 'page_home',
    slug: 'home',
    title: 'Homepage',
    status: 'published',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
};

const MOCK_SECTIONS: Record<string, SectionInstance[]> = {
  home: [
    {
      id: 'sec_1',
      pageId: 'page_home',
      sectionType: 'hero_banner',
      order: 1,
      isVisible: true,
      configJson: {
        title: "FREE LENS\nREPLACEMENT",
        subtitle: "Any Frame | Any Power | Any Reason",
        ctaLabel: "Find Nearby Stores",
        ctaUrl: "/stores",
        subtextPrimary: "Just pay ₹199 as Fitting Fee",
        subtextSecondary: "Get Premium Anti-Glare Lenses. Upgrades are available",
        bannerImageUrl: "",
        countdownEndDatetime: new Date(Date.now() + 86400000 * 2).toISOString(),
        badgeText: "ENDS IN",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'sec_2',
      pageId: 'page_home',
      sectionType: 'secondary_banner',
      order: 2,
      isVisible: true,
      configJson: {
        title: "Join hustlr CLUB",
        subtitle: "Get FREE Hustlr Eyeglasses",
        description: "with BLU screen lenses",
        ctaLabel: "Claim Membership",
        bottomRibbonText: "Ending on 16th Aug >",
        bannerImageUrl: "",
        ctaUrl: "/membership"
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'sec_3',
      pageId: 'page_home',
      sectionType: 'category_rail',
      order: 3,
      isVisible: true,
      configJson: {
        sectionTitle: "Eyeglasses",
        sectionTag: "with Power",
        tiles: [
          { label: "Men", imageUrl: "", targetUrl: "/products?category=eyeglasses&gender=men" },
          { label: "Women", imageUrl: "", targetUrl: "/products?category=eyeglasses&gender=women" },
          { label: "Kids", imageUrl: "", targetUrl: "/products?category=eyeglasses&gender=kids" },
          { label: "On Sale", imageUrl: "", targetUrl: "/products?category=eyeglasses&sale=true", badgeText: "Starts @ ₹800" },
        ]
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'sec_4',
      pageId: 'page_home',
      sectionType: 'category_rail',
      order: 4,
      isVisible: true,
      configJson: {
        sectionTitle: "Sunglasses",
        sectionTag: "UV Protection",
        tiles: [
          { label: "Men", imageUrl: "", targetUrl: "/products?category=sunglasses&gender=men" },
          { label: "Women", imageUrl: "", targetUrl: "/products?category=sunglasses&gender=women" },
          { label: "Kids", imageUrl: "", targetUrl: "/products?category=sunglasses&gender=kids" },
          { label: "On Sale", imageUrl: "", targetUrl: "/products?category=sunglasses&sale=true", badgeText: "Starts @ ₹500" },
        ]
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'sec_5',
      pageId: 'page_home',
      sectionType: 'category_rail',
      order: 5,
      isVisible: true,
      configJson: {
        sectionTitle: "Contact Lenses & Accessories",
        sectionTag: "Essentials",
        tiles: [
          { label: "Daily Disposable", imageUrl: "", targetUrl: "/products?category=contact-lenses&type=daily" },
          { label: "Monthly", imageUrl: "", targetUrl: "/products?category=contact-lenses&type=monthly" },
          { label: "Color Lenses", imageUrl: "", targetUrl: "/products?category=contact-lenses&type=color" },
          { label: "Solutions", imageUrl: "", targetUrl: "/products?category=accessories&type=solution", badgeText: "Best Seller" },
        ]
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'sec_6',
      pageId: 'page_home',
      sectionType: 'poster_slider',
      order: 6,
      isVisible: true,
      configJson: {
        title: "#Trending at Eyevengers",
        posters: [
          { ctaText: "Shop Spider-Man", ctaUrl: "/collabs/spiderman", imageUrl: "" },
          { ctaText: "Shop Marvel", ctaUrl: "/collabs/marvel", imageUrl: "" },
          { ctaText: "Shop Harry Potter", ctaUrl: "/collabs/harry-potter", imageUrl: "" }
        ]
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'sec_7',
      pageId: 'page_home',
      sectionType: 'specials_grid',
      order: 7,
      isVisible: true,
      configJson: {
        title: "Eyevengers Specials",
        items: [
          { label: "Lens Replace", targetUrl: "/services/lens-replace", ribbonText: "FREE" },
          { label: "Zero Power", targetUrl: "/collections/zero-power" },
          { label: "Reading", targetUrl: "/collections/reading" },
          { label: "Power Sun", targetUrl: "/collections/power-sunglasses" }
        ]
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'sec_8',
      pageId: 'page_home',
      sectionType: 'promo_slider',
      order: 8,
      isVisible: true,
      configJson: {
        slides: [
          { imageUrl: "", targetUrl: "/offers/1" },
          { imageUrl: "", targetUrl: "/offers/2" }
        ]
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'sec_9',
      pageId: 'page_home',
      sectionType: 'media_slider',
      order: 9,
      isVisible: true,
      configJson: {
        cards: [
          { mediaType: "video", title: "FLIP - Convertible Frames", ctaLabel: "Shop Now", ctaUrl: "/products", mediaUrl: "" },
          { mediaType: "image", title: "Air Flex Series", ctaLabel: "Shop Now", ctaUrl: "/products", mediaUrl: "" }
        ]
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'sec_10',
      pageId: 'page_home',
      sectionType: 'spotlight',
      order: 10,
      isVisible: true,
      configJson: {
        title: "Spotlight",
        cards: [
          { heading: "Buy online, pick up anytime", description: "At a store near you", ctaUrl: "/stores", backgroundColor: "#f3f4f6", iconPlaceholderColor: "#e5e7eb" },
          { heading: "Gift Cards", description: "Give the gift of perfect vision", ctaUrl: "/gift-cards", backgroundColor: "#fef3c7", iconPlaceholderColor: "#fde68a" }
        ]
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'sec_11',
      pageId: 'page_home',
      sectionType: 'guide_slider',
      order: 11,
      isVisible: true,
      configJson: {
        title: "How to buy your glasses",
        guides: [
          { pillLabel: "Step 1", headline: "Select the right frame", backgroundColor: "#0B1550", videoUrl: "" },
          { pillLabel: "Step 2", headline: "Find your frame size", backgroundColor: "#1e3a8a", videoUrl: "" },
          { pillLabel: "Step 3", headline: "Upload prescription", backgroundColor: "#172554", videoUrl: "" }
        ]
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'sec_12',
      pageId: 'page_home',
      sectionType: 'collection_grid',
      order: 12,
      isVisible: true,
      configJson: {
        heading: "Exclusively at Eyevengers",
        subheading: "Get the perfect vision and style",
        cards: [
          { title: "Crystal Clear", subtitle: "Transparent Frames", imageUrl: "", accentBorderColor: "#3b82f6", filterQuery: "color=transparent" },
          { title: "Tortoise Shell", subtitle: "Classic Patterns", imageUrl: "", accentBorderColor: "#d97706", filterQuery: "color=tortoise" },
          { title: "Metal Rimless", subtitle: "Minimalist Look", imageUrl: "", accentBorderColor: "#64748b", filterQuery: "type=rimless" },
          { title: "Bold Signature", subtitle: "Thick Acetate", imageUrl: "", accentBorderColor: "#0f172a", filterQuery: "material=acetate" }
        ]
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // In a real app, query MongoDB: Page.findOne({ slug, status: 'published' }).populate('sections')
  const page = MOCK_PAGES[slug];
  
  if (!page) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }

  let sections = MOCK_SECTIONS[slug] || [];
  
  // Filter visible and sort by order
  sections = sections
    .filter(sec => sec.isVisible)
    .sort((a, b) => a.order - b.order);

  return NextResponse.json({ page, sections });
}
