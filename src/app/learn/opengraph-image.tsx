import { learningImage } from "./_share-image";

export const alt = "The SeniorSeat learning path";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return learningImage("The learning path", "Seven chapters from the first idea to a growing app");
}
