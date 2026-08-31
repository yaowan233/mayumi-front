import {Button} from "@heroui/react";

export type DraftAction = "save" | "publish";

const SaveIcon = () => (
    <svg aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
        <polyline points="17 21 17 13 7 13 7 21"/>
        <polyline points="7 3 7 8 15 8"/>
    </svg>
);

const PublishIcon = () => (
    <svg aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 16V4"/>
        <path d="m7 9 5-5 5 5"/>
        <path d="M20 15v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4"/>
    </svg>
);

interface DraftSaveActionsProps {
    pendingAction: DraftAction | null;
    canPublish: boolean;
    publishLabel: string;
    onSave: () => void;
    onPublish: () => void;
}

export function DraftSaveActions({
    pendingAction,
    canPublish,
    publishLabel,
    onSave,
    onPublish,
}: DraftSaveActionsProps) {
    return (
        <div className="flex flex-wrap items-center justify-end gap-3">
            <Button
                size="lg"
                variant="secondary"
                className="px-6 font-bold"
                isDisabled={pendingAction !== null}
                isPending={pendingAction === "save"}
                onPress={onSave}
            >
                {pendingAction !== "save" && <SaveIcon/>}
                {pendingAction === "save" ? "正在保存..." : "保存草稿"}
            </Button>
            {canPublish && (
                <Button
                    size="lg"
                    variant="primary"
                    className="px-8 font-bold shadow-primary/20"
                    isDisabled={pendingAction !== null}
                    isPending={pendingAction === "publish"}
                    onPress={onPublish}
                >
                    {pendingAction !== "publish" && <PublishIcon/>}
                    {pendingAction === "publish" ? "正在发布..." : publishLabel}
                </Button>
            )}
        </div>
    );
}
