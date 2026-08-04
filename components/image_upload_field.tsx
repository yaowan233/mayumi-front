"use client";

import Image from "next/image";
import {useRef, useState} from "react";
import {Button, Description, Input, Label, TextField} from "@heroui/react";

import {siteConfig} from "@/config/site";


type ImagePurpose = "tournament-banner" | "team-icon";

const UploadIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 16V4"/>
        <polyline points="7 9 12 4 17 9"/>
        <path d="M5 20h14"/>
    </svg>
);

export function ImageUploadField({
    label,
    value,
    onChange,
    purpose,
    description,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    purpose: ImagePurpose;
    description: string;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState("");
    const isBanner = purpose === "tournament-banner";
    const canPreview = /^https?:\/\//i.test(value);

    const upload = async (file: File) => {
        setError("");
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
            setError("仅支持 JPG、PNG 和 WebP 图片");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError("图片不能超过 5 MB");
            return;
        }

        setIsUploading(true);
        try {
            const body = new FormData();
            body.append("file", file);
            const response = await fetch(
                `${siteConfig.backend_url}/api/upload-image?purpose=${encodeURIComponent(purpose)}`,
                {method: "POST", body, credentials: "include"},
            );
            const result = await response.json().catch(() => null);
            if (!response.ok) throw new Error(result?.detail || "图片上传失败");

            const backendUrl = siteConfig.backend_url.replace(/\/$/, "");
            onChange(`${backendUrl}${result.path}`);
        } catch (uploadError) {
            setError(uploadError instanceof Error ? uploadError.message : "图片上传失败");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <div className="flex flex-col gap-3">
            <Label>{label}</Label>
            <div className={`relative overflow-hidden rounded-xl border border-default-200 bg-default-100 ${isBanner ? "aspect-video w-full max-w-xl" : "h-28 w-28"}`}>
                {canPreview ? (
                    <Image
                        src={value}
                        alt={`${label}预览`}
                        fill
                        unoptimized
                        sizes={isBanner ? "(max-width: 768px) 100vw, 576px" : "112px"}
                        className="object-cover"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center px-3 text-center text-sm text-default-400">
                        {value ? "图片链接无效" : "暂无图片"}
                    </div>
                )}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void upload(file);
                }}
            />
            <div className="flex flex-wrap items-center gap-3">
                <Button
                    variant="secondary"
                    isPending={isUploading}
                    onPress={() => fileInputRef.current?.click()}
                >
                    {!isUploading && <UploadIcon/>}
                    {isUploading ? "上传中..." : value ? "重新上传" : "选择图片"}
                </Button>
                {value && (
                    <Button variant="ghost" onPress={() => onChange("")}>
                        移除图片
                    </Button>
                )}
            </div>
            <Description>{description}；支持 JPG、PNG、WebP，最大 5 MB</Description>

            <TextField>
                <Label className="text-xs text-default-500">或填写图片链接（兼容旧数据）</Label>
                <Input
                    fullWidth
                    variant="secondary"
                    placeholder="https://..."
                    value={value}
                    onChange={(event) => {
                        setError("");
                        onChange(event.target.value);
                    }}
                />
            </TextField>
            {error && <p className="text-sm text-danger">{error}</p>}
        </div>
    );
}
