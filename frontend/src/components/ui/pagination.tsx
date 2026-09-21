"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "cn";

export interface PaginationProps extends React.ComponentProps<"nav"> {}

export function Pagination({ className, ...props }: PaginationProps) {
  return (
    <nav
      role="navigation"
      aria-label="Sayfalandırma"
      className={cn("mx-auto flex w-full flex-col items-center justify-center gap-3.5 select-none", className)}
      {...props}
    />
  );
}

export function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      className={cn("flex flex-row items-center gap-1.5 sm:gap-2", className)}
      {...props}
    />
  );
}

export function PaginationItem({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return <li className={cn("inline-flex items-center", className)} {...props} />;
}

export interface PaginationLinkProps extends React.ComponentProps<"button"> {
  isActive?: boolean;
}

export function PaginationLink({
  className,
  isActive,
  children,
  ...props
}: PaginationLinkProps) {
  return (
    <button
      type="button"
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "min-w-10 h-10 px-3.5 flex items-center justify-center text-sm font-black uppercase transition-all rounded-xs brutal-border border-2 cursor-pointer",
        isActive
          ? "bg-[#FEF08A] text-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] -translate-y-0.5 scale-105"
          : "bg-white text-black hover:bg-[#FFFBEB] shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none",
        props.disabled && "opacity-40 pointer-events-none cursor-not-allowed shadow-none",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export interface PaginationPreviousProps extends React.ComponentProps<"button"> {
  label?: string;
}

export function PaginationPrevious({
  className,
  label = "Önceki",
  disabled,
  ...props
}: PaginationPreviousProps) {
  return (
    <button
      type="button"
      aria-label="Önceki sayfaya git"
      disabled={disabled}
      className={cn(
        "h-10 px-3 sm:px-4 flex items-center gap-1.5 text-xs sm:text-sm font-black uppercase transition-all rounded-xs brutal-border border-2 bg-white text-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-[#FFFBEB] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none cursor-pointer",
        disabled && "opacity-40 pointer-events-none cursor-not-allowed shadow-none",
        className
      )}
      {...props}
    >
      <ChevronLeft className="w-4 h-4 shrink-0 font-black" />
      <span className="hidden xs:inline sm:inline">{label}</span>
    </button>
  );
}

export interface PaginationNextProps extends React.ComponentProps<"button"> {
  label?: string;
}

export function PaginationNext({
  className,
  label = "Sonraki",
  disabled,
  ...props
}: PaginationNextProps) {
  return (
    <button
      type="button"
      aria-label="Sonraki sayfaya git"
      disabled={disabled}
      className={cn(
        "h-10 px-3 sm:px-4 flex items-center gap-1.5 text-xs sm:text-sm font-black uppercase transition-all rounded-xs brutal-border border-2 bg-white text-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-[#FFFBEB] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none cursor-pointer",
        disabled && "opacity-40 pointer-events-none cursor-not-allowed shadow-none",
        className
      )}
      {...props}
    >
      <span className="hidden xs:inline sm:inline">{label}</span>
      <ChevronRight className="w-4 h-4 shrink-0 font-black" />
    </button>
  );
}

export function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-10 w-8 sm:w-10 items-center justify-center font-black text-base text-black/60 select-none",
        className
      )}
      {...props}
    >
      <MoreHorizontal className="w-4 h-4" />
      <span className="sr-only">Daha fazla sayfa</span>
    </span>
  );
}

export interface PaginationDotsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * UIPageControl / Swipeable page dot indicator
 * Renders one indicator per page, with a solid, expanded dot marking the current page.
 */
export function PaginationDots({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationDotsProps) {
  if (totalPages <= 1) return null;

  return (
    <div
      role="tablist"
      aria-label="Page dots control"
      className={cn("flex items-center justify-center gap-2 py-1", className)}
    >
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
        const isCurrent = page === currentPage;
        return (
          <button
            key={page}
            type="button"
            role="tab"
            aria-selected={isCurrent}
            aria-label={`Sayfa ${page}`}
            onClick={() => onPageChange(page)}
            className={cn(
              "transition-all duration-200 cursor-pointer focus:outline-hidden",
              isCurrent
                ? "w-6 h-2.5 rounded-full bg-[#FB923C] border-2 border-black shadow-[1.5px_1.5px_0_0_rgba(0,0,0,1)]"
                : "w-2.5 h-2.5 rounded-full bg-black/20 hover:bg-black/50 border border-black/40 hover:scale-110"
            )}
          />
        );
      })}
    </div>
  );
}

export interface FullPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  showDots?: boolean;
  className?: string;
}

/**
 * High-level Neo-brutalist Pagination Component combining:
 * 1. Page-number links with aria-current="page"
 * 2. Previous / next links with disabled edges
 * 3. Ellipsis overflow indicator
 * 4. UIPageControl page dots indicator
 */
export function FullPagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  showDots = true,
  className,
}: FullPaginationProps) {
  if (totalPages <= 1) return null;

  // Build range of page numbers and ellipsis
  const generatePaginationItems = () => {
    const totalNumbers = siblingCount * 2 + 3; // current + siblings + first + last
    const totalBlocks = totalNumbers + 2; // + 2 for potential two ellipses

    if (totalPages <= totalBlocks) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
      return [...leftRange, "DOTS_RIGHT", totalPages];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = Array.from(
        { length: rightItemCount },
        (_, i) => totalPages - rightItemCount + i + 1
      );
      return [1, "DOTS_LEFT", ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, i) => leftSiblingIndex + i
      );
      return [1, "DOTS_LEFT", ...middleRange, "DOTS_RIGHT", totalPages];
    }

    return Array.from({ length: totalPages }, (_, i) => i + 1);
  };

  const pages = generatePaginationItems();

  return (
    <Pagination className={className}>
      <PaginationContent>
        {/* 2. Previous link */}
        <PaginationItem>
          <PaginationPrevious
            disabled={currentPage <= 1}
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          />
        </PaginationItem>

        {/* 1. Page-number links & 3. Ellipsis */}
        {pages.map((item, index) => {
          if (item === "DOTS_LEFT" || item === "DOTS_RIGHT") {
            return (
              <PaginationItem key={`dots-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            );
          }

          const pageNum = Number(item);
          const isActive = pageNum === currentPage;

          return (
            <PaginationItem key={pageNum}>
              <PaginationLink
                isActive={isActive}
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </PaginationLink>
            </PaginationItem>
          );
        })}

        {/* 2. Next link */}
        <PaginationItem>
          <PaginationNext
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          />
        </PaginationItem>
      </PaginationContent>

      {/* 4. Page dots (UIPageControl style) */}
      {showDots && (
        <PaginationDots
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </Pagination>
  );
}
