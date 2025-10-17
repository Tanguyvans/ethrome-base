import { writeFileSync, mkdirSync } from 'fs';
import { minikitConfig } from './minikit.config.ts';

const manifest = {
  accountAssociation: minikitConfig.accountAssociation,
  frame: {
    version: minikitConfig.miniapp.version,
    name: minikitConfig.miniapp.name,
    iconUrl: minikitConfig.miniapp.iconUrl,
    splashImageUrl: minikitConfig.miniapp.splashImageUrl,
    splashBackgroundColor: minikitConfig.miniapp.splashBackgroundColor,
    homeUrl: minikitConfig.miniapp.homeUrl,
    webhookUrl: minikitConfig.miniapp.webhookUrl,
  },
};

// Ensure directory exists
mkdirSync('public/.well-known', { recursive: true });

// Write manifest
writeFileSync(
  'public/.well-known/farcaster.json',
  JSON.stringify(manifest, null, 2)
);

console.log('✅ Manifest generated at public/.well-known/farcaster.json');
