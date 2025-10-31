'use client'
import Image from "next/image";
import {title} from "@/components/primitives";
import {useState} from "react";
import {Link} from "@heroui/link";

export interface Tournament {
    name: string;
    abbreviation: string;
    description: string;
    start_date: string;
    end_date: string;
    pic_url: string;
}

export const TournamentComponent = (tournament: Tournament) => {
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseEnter = () => {
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
    };
    let tournament_href = "/tournaments/" + tournament
    return (
        <Link
            key={tournament.name}
            className="items-center justify-center"
            href={tournament_href}
            target="_blank"
        >
            <div
                className="relative flex-auto"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <div className="image-container">
                    <Image
                        width={300}
                        height={200}
                        src={tournament.pic_url}
                        alt={tournament.name}
                    />
                    <div
                        className={`description-container opacity-0 ${
                            isHovered ? 'opacity-100' : ''
                        } transition-opacity duration-300`}
                    >
                        <h2 className={title({size: 'sm'})}>{tournament.description}</h2>
                    </div>
                </div>
                <div className="absolute top-0 left-0 right-0 flex items-center justify-center">
                    <h1 className={title({size: 'sm'})}>{
                        isHovered ? tournament.name : tournament.abbreviation
                    }</h1>
                </div>
            </div>
        </Link>
    );
};