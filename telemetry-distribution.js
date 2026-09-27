// Distribution channel this artifact belongs to.
//
// The release build owns this value: scripts/package.sh overwrites this file
// inside a temporary staging copy so every store artifact embeds its own
// channel. It is deliberately NOT inferred at runtime — an Edge user may have
// installed from the Chrome Web Store, so the running browser says nothing
// about where the package came from.
//
// The committed default is what unpacked/development loads report.

export const DISTRIBUTION = "development";
