import craftskyImage from "@/assets/homepage/works/craftsky.png";
import cpsresumeImage from "@/assets/homepage/works/cpsresume-square.jpg";
import mirinkuyanImage from "@/assets/homepage/works/mirinkuyan.jpg";
import moremobilityImage from "@/assets/homepage/works/moremobility_340.png";
import partyparrotStreamdeckImage from "@/assets/homepage/works/partyparrot_streamdeck.png";
import passphraseGeneratorJapaneseImage from "@/assets/homepage/works/passphrase-generator-japanese.png";
import serverImage from "@/assets/homepage/works/server_1_340.jpg";
import stationSignGeneratorImage from "@/assets/homepage/works/station_sign_generator.png";
import ultitypeImage from "@/assets/homepage/works/ultitype.png";
import type { ProjectImage } from "./projects";

export const projectImages: Readonly<Record<ProjectImage, ImageMetadata>> = {
  mirinkuyan: mirinkuyanImage,
  craftsky: craftskyImage,
  "station-sign": stationSignGeneratorImage,
  "passphrase-generator-japanese": passphraseGeneratorJapaneseImage,
  ultitype: ultitypeImage,
  cpsresume: cpsresumeImage,
  "cpu-partyparrot": partyparrotStreamdeckImage,
  moremobility: moremobilityImage,
  "create-cities-server": serverImage,
};
