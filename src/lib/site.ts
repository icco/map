import type { NavLink } from "@icco/react-common/SiteHeader"

export const site = {
  name: "Nat and Mel's Map",
  description: "The cities Nat and Mel have lived in and visited.",
  url: "https://map.natwelch.com",
  repository: "https://github.com/icco/map.natwelch.com",
  navigation: [{ name: "Map", href: "/" }] satisfies NavLink[],
  analyticsPath: "",
  footer: {
    showRecurseCenter: true,
    showPrivacyPolicy: true,
    showSocial: false,
    showRecurseRing: false,
    showXXIIVVRing: false,
  },
} as const
