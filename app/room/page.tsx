import { redirect } from "next/navigation";

export default function RoomRoot() {
  // If user hits /room without an ID, send them back to landing page.
  redirect("/");
}
