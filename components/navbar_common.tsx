import { NavbarItem } from "@heroui/navbar";
import { Link } from "@heroui/link";
import { Button } from "@heroui/button";
import { GithubIcon, HeartFilledIcon } from "@/components/icons";
import { ThemeSwitch } from "@/components/theme-switch";
import { siteConfig } from "@/config/site";
import { useContext } from "react";
import CurrentUserContext from "@/app/user_context";
import { Avatar } from "@heroui/avatar";
import { Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, DropdownSection } from "@heroui/dropdown";


// --- 用户状态组件 (增强版) ---
export const UserStatus = () => {
    const currentUser = useContext(CurrentUserContext);

    if (!currentUser?.currentUser) {
        return (
            <NavbarItem>
                <Button
                    as={Link}
                    className="text-sm font-bold bg-primary text-white shadow-lg shadow-primary/20"
                    href={`https://osu.ppy.sh/oauth/authorize?client_id=${siteConfig.client_id}&redirect_uri=${siteConfig.web_url}/oauth&response_type=code&scope=public`}
                    variant="solid"
                >
                    登录
                </Button>
            </NavbarItem>
        );
    }

    return (
        <Dropdown placement="bottom-end">
            <DropdownTrigger>
                <Avatar
                    isBordered
                    as="button"
                    className="transition-transform"
                    color="primary"
                    name={currentUser.currentUser.name}
                    size="sm"
                    src={`https://a.ppy.sh/${currentUser.currentUser.uid}`}
                />
            </DropdownTrigger>
            <DropdownMenu aria-label="Profile Actions" variant="flat">
                <DropdownSection showDivider>
                    <DropdownItem key="profile" className="h-14 gap-2">
                        <p className="font-semibold">登录用户</p>
                        <p className="font-semibold text-primary">{currentUser.currentUser.name}</p>
                    </DropdownItem>
                    <DropdownItem key="user_info" href="/user-info">个人信息</DropdownItem>
                    <DropdownItem key="settings" href="/tournament-management">管理后台</DropdownItem>
                </DropdownSection>
                <DropdownItem key="logout" color="danger" onPress={async () => {
                    await fetch(siteConfig.backend_url + "/api/logout", {method: "POST", credentials: "include"})
                    currentUser?.setCurrentUser(null)
                    // 可选：刷新页面或跳转首页
                    window.location.href = "/";
                }}>
                    登出
                </DropdownItem>
            </DropdownMenu>
        </Dropdown>
    );
}
