const ROOT_URL = 'https://ethrome-base.vercel.app';

export const minikitConfig = {
  accountAssociation: {
    header: "",
    payload: "",
    signature: ""
  },
  miniapp: {
    version: "1",
    name: "XMTP Chat",
    subtitle: "Decentralized Messaging",
    description: "Secure, decentralized messaging powered by XMTP protocol",
    screenshotUrls: [`${ROOT_URL}/splash.svg`],
    iconUrl: `${ROOT_URL}/icon.svg`,
    splashImageUrl: `${ROOT_URL}/splash.svg`,
    splashBackgroundColor: "#646cff",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "social",
    tags: ["messaging", "xmtp", "decentralized", "chat", "web3"],
    heroImageUrl: `${ROOT_URL}/hero.svg`,
    tagline: "Secure messaging on XMTP",
    ogTitle: "XMTP Chat - Decentralized Messaging",
    ogDescription: "Secure, decentralized messaging powered by XMTP protocol",
    ogImageUrl: `${ROOT_URL}/hero.svg`,
  },
} as const;
