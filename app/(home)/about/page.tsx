import {Link} from "@heroui/link";

export default function AboutPage() {
    return (
        <div className="flex flex-col gap-3 items-center">
            <h1 className="text-4xl font-bold">关于</h1>
            <div className="flex flex-row">
                网站开发：
                <Link
                    isExternal
                    className="flex items-center gap-1 text-current"
                    href="https://osu.ppy.sh/users/3162675"
                    title="yaowan233 OSU主页"
                >
                    <p className="text-primary">yaowan233</p>
                </Link>
            </div>
            <div className="flex flex-row gap-2">
                致谢：
                <Link
                    isExternal
                    className="flex items-center gap-1 text-current"
                    href="https://osu.ppy.sh/users/5321112"
                    title="Jason House OSU主页"
                >
                    <p className="text-primary">Jason House</p>
                </Link>
                <Link
                    isExternal
                    className="flex items-center gap-1 text-current"
                    href="https://osu.ppy.sh/users/2360046"
                    title="Candy OSU主页"
                >
                    <p className="text-primary">Candy</p>
                </Link>
            </div>
            如有任何问题，欢迎直接Osu私信联系
        </div>
    );
}
