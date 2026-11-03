"use client";

import type { SavedConnection } from "@compooss/types";
import { Button, IconButton, cn } from "@compooss/ui";
import { formatDistanceToNow } from "date-fns";
import { Clock, Lock, Pencil, Plug2, Star, StarOff, Trash2 } from "lucide-react";

type Props = {
  connection: SavedConnection;
  onConnect: (connection: SavedConnection) => void;
  onEdit: (connection: SavedConnection) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  isConnecting?: boolean;
};

export const ConnectionCard: React.FC<Props> = ({
  connection,
  onConnect,
  onEdit,
  onDelete,
  onToggleFavorite,
  isConnecting,
}) => {
  const FavIcon = connection.isFavorite ? Star : StarOff;

  return (
    <div
      className="group relative rounded-xl border border-border/50 hover:border-border/80 hover:shadow-sm transition-all duration-150 cursor-pointer overflow-hidden bg-card/40 hover:bg-card/70"
      onClick={() => onConnect(connection)}
    >
      {/* Subtle color tint overlay */}
      {connection.color && (
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{ backgroundColor: connection.color }}
        />
      )}

      {/* Color accent strip */}
      {connection.color && (
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
          style={{ backgroundColor: connection.color }}
        />
      )}

      <div className={cn("flex items-center gap-2.5 px-3.5 py-2.5", connection.color && "pl-5")}>
        {!connection.color && (
          <div className="w-1.5 h-1.5 rounded-full bg-border/60 shrink-0" />
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[13px] font-medium text-foreground truncate leading-tight">
              {connection.name}
            </span>
            {connection.isFavorite && (
              <Star className="h-2.5 w-2.5 fill-warning text-warning shrink-0" />
            )}
            {connection.readOnly && (
              <span title="Read-only" className="shrink-0">
                <Lock className="h-2.5 w-2.5 text-warning" />
              </span>
            )}
            {connection.label && (
              <span className="text-[10px] px-1.5 py-px bg-primary/8 text-primary/70 rounded-full font-medium shrink-0 border border-primary/10">
                {connection.label}
              </span>
            )}
          </div>
          {connection.lastUsedAt && (
            <span className="text-[10px] text-muted-foreground/40 flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />
              {formatDistanceToNow(new Date(connection.lastUsedAt), { addSuffix: true })}
            </span>
          )}
        </div>

        {/* Hover actions */}
        <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <IconButton
            icon={
              <FavIcon
                className={cn(
                  "h-3.5 w-3.5",
                  connection.isFavorite && "fill-warning text-warning",
                )}
              />
            }
            label={connection.isFavorite ? "Unfavorite" : "Favorite"}
            className={cn(
              "rounded-md",
              !connection.isFavorite && "text-muted-foreground/40 hover:text-warning",
            )}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(connection.id);
            }}
          />
          <IconButton
            icon={<Pencil className="h-3.5 w-3.5" />}
            label="Edit"
            className="rounded-md text-muted-foreground/40 hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(connection);
            }}
          />
          <IconButton
            variant="danger"
            icon={<Trash2 className="h-3.5 w-3.5" />}
            label="Delete"
            className="rounded-md"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(connection.id);
            }}
          />
        </div>

        <Button
          variant="soft"
          size="sm"
          icon={<Plug2 className="h-3 w-3" />}
          loading={isConnecting}
          className="rounded-lg shrink-0 text-xs h-7 px-2.5"
          onClick={(e) => {
            e.stopPropagation();
            onConnect(connection);
          }}
        >
          Connect
        </Button>
      </div>
    </div>
  );
};
