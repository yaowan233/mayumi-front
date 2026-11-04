import type { Metadata } from "next";
import {RecommendationPage} from "@/components/recommendation_page";

export const metadata: Metadata = { title: "谱面推荐", description: "按你的条件发现谱面，或结合 BP 探索适合自己的挑战。" };

export default function RecommendPage() {
    return <RecommendationPage/>;
}
