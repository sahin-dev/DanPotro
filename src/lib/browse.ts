export const browseCategories = ["All", "Medical", "Emergency", "Education", "Food support"] as const;

export const browseSorts = {
  urgent: "Ending soonest",
  nearly: "Closest to goal",
  newest: "Newest",
  supported: "Most supported",
} as const;

export type BrowseState = {
  q: string;
  category: (typeof browseCategories)[number];
  sort: keyof typeof browseSorts;
  completed: boolean;
};
