import { Request, Response } from 'express';
// We are using an in-memory store here because DATABASE_URL was missing.
// In production, swap back to Prisma/Mongoose queries.

export let MOCK_DB = {
  pages: [
    {
      id: 'page_home',
      slug: 'home',
      title: 'Homepage',
      status: 'published',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  sections: [
    {
      id: 'sec_1',
      pageId: 'page_home',
      sectionType: 'hero_banner',
      order: 1,
      isVisible: true,
      configJson: JSON.stringify({
        title: "FREE LENS\nREPLACEMENT",
        subtitle: "Any Frame | Any Power | Any Reason",
        ctaLabel: "Find Nearby Stores",
        ctaUrl: "/stores",
        subtextPrimary: "Just pay ₹199 as Fitting Fee",
        subtextSecondary: "Get Premium Anti-Glare Lenses",
        bannerImageUrl: "",
        countdownEndDatetime: new Date(Date.now() + 86400000 * 2).toISOString(),
        badgeText: "ENDS IN",
      })
    },
    {
      id: 'sec_2',
      pageId: 'page_home',
      sectionType: 'secondary_banner',
      order: 2,
      isVisible: true,
      configJson: JSON.stringify({
        title: "Join hustlr CLUB",
        subtitle: "Get FREE Hustlr Eyeglasses",
        description: "with BLU screen lenses",
        ctaLabel: "Claim Membership",
        bottomRibbonText: "Ending on 16th Aug >",
        bannerImageUrl: "",
        ctaUrl: "/membership"
      })
    },
    {
      id: 'sec_3',
      pageId: 'page_home',
      sectionType: 'CategoryRail',
      order: 3,
      isVisible: true,
      configJson: JSON.stringify({
        sectionTitle: "Eyeglasses",
        sectionTag: "with Power",
        tiles: [
          { label: "Men", imageUrl: "", targetUrl: "/products?category=eyeglasses&gender=men" },
          { label: "Women", imageUrl: "", targetUrl: "/products?category=eyeglasses&gender=women" },
          { label: "Kids", imageUrl: "", targetUrl: "/products?category=eyeglasses&gender=kids" },
          { label: "On Sale", imageUrl: "", targetUrl: "/products?category=eyeglasses&sale=true", badgeText: "Starts @ ₹800" }
        ]
      })
    },
    {
      id: 'sec_4',
      pageId: 'page_home',
      sectionType: 'CategoryRail',
      order: 4,
      isVisible: true,
      configJson: JSON.stringify({
        sectionTitle: "Sunglasses",
        sectionTag: "UV Protection",
        tiles: [
          { label: "Men", imageUrl: "", targetUrl: "/products?category=sunglasses&gender=men" },
          { label: "Women", imageUrl: "", targetUrl: "/products?category=sunglasses&gender=women" },
          { label: "Kids", imageUrl: "", targetUrl: "/products?category=sunglasses&gender=kids" },
          { label: "On Sale", imageUrl: "", targetUrl: "/products?category=sunglasses&sale=true", badgeText: "Starts @ ₹500" }
        ]
      })
    },
    {
      id: 'sec_5',
      pageId: 'page_home',
      sectionType: 'CategoryRail',
      order: 5,
      isVisible: true,
      configJson: JSON.stringify({
        sectionTitle: "Contact Lenses & Accessories",
        sectionTag: "Essentials",
        tiles: [
          { label: "Daily Disposable", imageUrl: "", targetUrl: "/products?category=contact-lenses&type=daily" },
          { label: "Monthly", imageUrl: "", targetUrl: "/products?category=contact-lenses&type=monthly" },
          { label: "Color Lenses", imageUrl: "", targetUrl: "/products?category=contact-lenses&type=color" },
          { label: "Solutions", imageUrl: "", targetUrl: "/products?category=accessories&type=solution", badgeText: "Best Seller" }
        ]
      })
    },
    {
      id: 'sec_6',
      pageId: 'page_home',
      sectionType: 'SliderBanner',
      order: 6,
      isVisible: true,
      configJson: JSON.stringify({
        slides: [
          { headline: "Run for Frame", subtext: "Experience the lightest frames ever made.", imageUrl: "", ctaUrl: "/campaigns/run-for-frame" },
          { headline: "Titanium Series", subtext: "Unbreakable. Flexible. Lightweight.", imageUrl: "", ctaUrl: "/collections/titanium" }
        ],
        autoplayMs: 3000
      })
    },
    {
      id: 'sec_7',
      pageId: 'page_home',
      sectionType: 'PosterSlider',
      order: 7,
      isVisible: true,
      configJson: JSON.stringify({
        title: "#Trending at Eyevengers",
        posters: [
          { ctaText: "Shop Spider-Man", ctaUrl: "/collabs/spiderman", imageUrl: "" },
          { ctaText: "Shop Marvel", ctaUrl: "/collabs/marvel", imageUrl: "" },
          { ctaText: "Shop Harry Potter", ctaUrl: "/collabs/harry-potter", imageUrl: "" }
        ]
      })
    },
    {
      id: 'sec_8',
      pageId: 'page_home',
      sectionType: 'SpecialsGrid',
      order: 8,
      isVisible: true,
      configJson: JSON.stringify({
        title: "Eyevengers Specials",
        items: [
          { label: "Lens Replace", targetUrl: "/services/lens-replace", ribbonText: "FREE" },
          { label: "Zero Power", targetUrl: "/collections/zero-power" },
          { label: "Reading", targetUrl: "/collections/reading" },
          { label: "Power Sun", targetUrl: "/collections/power-sunglasses" }
        ]
      })
    },
    {
      id: 'sec_9',
      pageId: 'page_home',
      sectionType: 'PromoSlider',
      order: 9,
      isVisible: true,
      configJson: JSON.stringify({
        slides: [
          { imageUrl: "", targetUrl: "/offers/1" },
          { imageUrl: "", targetUrl: "/offers/2" }
        ]
      })
    },
    {
      id: 'sec_10',
      pageId: 'page_home',
      sectionType: 'MediaSlider',
      order: 10,
      isVisible: true,
      configJson: JSON.stringify({
        cards: [
          { mediaType: "video", title: "FLIP - Convertible Frames", ctaLabel: "Shop Now", ctaUrl: "/products", mediaUrl: "" },
          { mediaType: "image", title: "Air Flex Series", ctaLabel: "Shop Now", ctaUrl: "/products", mediaUrl: "" }
        ]
      })
    },
    {
      id: 'sec_11',
      pageId: 'page_home',
      sectionType: 'Spotlight',
      order: 11,
      isVisible: true,
      configJson: JSON.stringify({
        title: "Spotlight",
        cards: [
          { heading: "Buy online, pick up anytime", description: "At a store near you", ctaUrl: "/stores", backgroundColor: "#f3f4f6", iconPlaceholderColor: "#e5e7eb" },
          { heading: "Gift Cards", description: "Give the gift of perfect vision", ctaUrl: "/gift-cards", backgroundColor: "#fef3c7", iconPlaceholderColor: "#fde68a" }
        ]
      })
    },
    {
      id: 'sec_12',
      pageId: 'page_home',
      sectionType: 'GuideSlider',
      order: 12,
      isVisible: true,
      configJson: JSON.stringify({
        title: "How to buy your glasses",
        guides: [
          { pillLabel: "Step 1", headline: "Select the right frame", backgroundColor: "#0B1550", videoUrl: "" },
          { pillLabel: "Step 2", headline: "Find your frame size", backgroundColor: "#1e3a8a", videoUrl: "" },
          { pillLabel: "Step 3", headline: "Upload prescription", backgroundColor: "#172554", videoUrl: "" }
        ]
      })
    },
    {
      id: 'sec_13',
      pageId: 'page_home',
      sectionType: 'CollectionCardsGrid',
      order: 13,
      isVisible: true,
      configJson: JSON.stringify({
        heading: "Exclusively at Eyevengers",
        subheading: "Get the perfect vision and style",
        cards: [
          { title: "Crystal Clear", subtitle: "Transparent Frames", imageUrl: "", accentBorderColor: "#3b82f6", filterQuery: "color=transparent" },
          { title: "Tortoise Shell", subtitle: "Classic Patterns", imageUrl: "", accentBorderColor: "#d97706", filterQuery: "color=tortoise" },
          { title: "Metal Rimless", subtitle: "Minimalist Look", imageUrl: "", accentBorderColor: "#64748b", filterQuery: "type=rimless" },
          { title: "Bold Signature", subtitle: "Thick Acetate", imageUrl: "", accentBorderColor: "#0f172a", filterQuery: "material=acetate" }
        ]
      })
    }
  ]
};

// GET all pages
export const getPages = async (req: Request, res: Response) => {
  res.json(MOCK_DB.pages);
};

// GET single page with its sections
export const getPageWithSections = async (req: Request, res: Response) => {
  const { slug } = req.params;
  const page = MOCK_DB.pages.find(p => p.slug === slug);

  if (!page) {
    return res.status(404).json({ error: 'Page not found' });
  }

  let sections = MOCK_DB.sections
    .filter(s => s.pageId === page.id)
    .sort((a, b) => a.order - b.order)
    .map(s => ({ ...s, configJson: JSON.parse(s.configJson) }));

  res.json({ ...page, sections });
};

// PUT update section config
export const updateSection = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { configJson, isVisible, order } = req.body;

  const sectionIndex = MOCK_DB.sections.findIndex(s => s.id === id);
  if (sectionIndex === -1) {
    return res.status(404).json({ error: 'Section not found' });
  }

  const section = MOCK_DB.sections[sectionIndex];
  
  if (configJson) section.configJson = JSON.stringify(configJson);
  if (isVisible !== undefined) section.isVisible = isVisible;
  if (order !== undefined) section.order = order;

  MOCK_DB.sections[sectionIndex] = section;

  res.json({ ...section, configJson: JSON.parse(section.configJson) });
};

// POST add new section
export const createSection = async (req: Request, res: Response) => {
  const { pageId, sectionType, configJson, order } = req.body;

  const newSection = {
    id: `sec_${Date.now()}`,
    pageId,
    sectionType,
    configJson: JSON.stringify(configJson || {}),
    order: order || MOCK_DB.sections.length + 1,
    isVisible: true
  };

  MOCK_DB.sections.push(newSection);

  res.status(201).json({ ...newSection, configJson: JSON.parse(newSection.configJson) });
};

// DELETE section
export const deleteSection = async (req: Request, res: Response) => {
  const { id } = req.params;
  MOCK_DB.sections = MOCK_DB.sections.filter(s => s.id !== id);
  res.json({ success: true, message: 'Section deleted' });
};
