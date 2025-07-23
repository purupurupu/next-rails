"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TagBadge } from "./TagBadge";
import type { Tag } from "../types/tag";

interface TagSelectorProps {
  tags: Tag[];
  selectedTagIds: number[];
  onSelectionChange: (tagIds: number[]) => void;
  onCreateTag?: () => void;
  placeholder?: string;
  className?: string;
}

export function TagSelector({
  tags,
  selectedTagIds,
  onSelectionChange,
  onCreateTag,
  placeholder = "Select tags...",
  className,
}: TagSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedTags = tags.filter((tag) => selectedTagIds.includes(tag.id));

  const toggleTag = (tagId: number) => {
    if (selectedTagIds.includes(tagId)) {
      onSelectionChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onSelectionChange([...selectedTagIds, tagId]);
    }
  };

  const removeTag = (tagId: number) => {
    onSelectionChange(selectedTagIds.filter((id) => id !== tagId));
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className="truncate">
              {selectedTags.length > 0
                ? `${selectedTags.length} tag${selectedTags.length > 1 ? "s" : ""} selected`
                : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput
              placeholder="Search tags..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandEmpty>
              <div className="p-2 text-center text-sm text-muted-foreground">
                No tags found.
                {onCreateTag && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setOpen(false);
                      onCreateTag();
                    }}
                    className="mt-2 w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create new tag
                  </Button>
                )}
              </div>
            </CommandEmpty>
            <CommandGroup>
              {tags.map((tag) => (
                <CommandItem
                  key={tag.id}
                  value={tag.name}
                  onSelect={() => toggleTag(tag.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedTagIds.includes(tag.id) ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <TagBadge
                    name={tag.name}
                    color={tag.color}
                    className="mr-2"
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedTags.map((tag) => (
            <TagBadge
              key={tag.id}
              name={tag.name}
              color={tag.color}
              onRemove={() => removeTag(tag.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
