'use client'
import { Link } from "@heroui/link";
import { Image } from "@heroui/image";
import { Card, CardFooter } from "@heroui/card";
import { Chip } from "@heroui/chip";
import NextImage from "next/image";

export interface Tournament {
    name: string;
    abbreviation: string;
    description: string;
    start_date: string;
    end_date: string;
    pic_url: string;
    mode: string;
}

const getModeColor = (mode: string) => {
    switch (mode.toLowerCase()) {
        case 'mania': return "primary";
        case 'osu': return "secondary";
        case 'taiko': return "danger";
        case 'fruits': return "success";
        default: return "default";
    }
};

export const TournamentComponent = ({ tournament }: { tournament: Tournament }) => {
    let tournament_href = "/tournaments/" + tournament.abbreviation + "/home";
    const modeColor = getModeColor(tournament.mode || "");

    const fallbackImage = "https://nextui.org/images/card-example-4.jpeg";
    const imgSrc = tournament.pic_url || fallbackImage;

    return (
        <Card
            as={Link}
            href={tournament_href}
            isPressable
            className="group relative w-full aspect-video border-none overflow-hidden bg-zinc-900 shadow-lg"
        >
            <Chip
                color={modeColor}
                variant="shadow"
                size="sm"
                className="absolute z-30 top-3 right-3 font-bold uppercase border border-white/20"
            >
                {tournament.mode}
            </Chip>

            {/* Layer 1: 氛围背景层 */}
            <div className="absolute inset-0 z-0">
                <Image
                    as={NextImage}
                    removeWrapper
                    className="w-full h-full object-cover blur-2xl opacity-50 scale-125 saturate-200"
                    src={imgSrc}
                    alt="background"
                    width={400}
                    height={300}
                    style={{ width: '100%', height: '100%' }}
                    priority
                />
            </div>

            {/* Layer 2: 核心展示层 */}
            <div className="relative z-10 w-full h-full flex items-center justify-center">
                <Image
                    as={NextImage}
                    className="w-full h-full object-contain drop-shadow-md transition-transform duration-500 group-hover:scale-105"
                    src={imgSrc}
                    alt={tournament.name}
                    width={600}
                    height={338}
                    style={{ width: '100%', height: '100%' }}
                    priority
                />
            </div>

            <div className="absolute inset-x-0 bottom-0 z-20 h-2/3 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />

            <CardFooter className="absolute z-20 bottom-0 flex flex-col items-start justify-end w-full pb-3 px-4 gap-1">
                <h4 className="text-white font-bold text-lg leading-tight line-clamp-1 drop-shadow-md group-hover:text-primary transition-colors">
                    {tournament.name}
                </h4>

                <div className="overflow-hidden transition-all duration-300 max-h-[40px] group-hover:max-h-[80px]">
                    <p className="text-tiny text-gray-300 font-normal line-clamp-2 leading-relaxed">
                        {tournament.description || "暂无详细描述..."}
                    </p>
                </div>
            </CardFooter>
        </Card>
    );
};