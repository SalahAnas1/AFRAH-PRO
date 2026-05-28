"use client";

import { useState } from "react";
import type { Owner } from "./types";
import OwnerCard  from "./OwnerCard";
import ActionsMenu from "./ActionsMenu";

interface Props {
  owners:         Owner[];
  onView:         (o: Owner) => void;
  onEdit:         (o: Owner) => void;
  onToggleStatus: (o: Owner) => void;
  onResetPass:    (o: Owner) => void;
  onLoginAs:      (o: Owner) => void;
  onDelete:       (o: Owner) => void;
}

export default function OwnersGrid({
  owners, onView, onEdit, onToggleStatus, onResetPass, onLoginAs, onDelete,
}: Props) {
  const [openMenu, setOpenMenu] = useState<{ id: number; rect: DOMRect } | null>(null);

  if (owners.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-border shadow-sm p-16 text-center">
        <p className="text-3xl mb-3">👤</p>
        <p className="text-gray-text text-sm">لا يوجد أصحاب محلات مطابقون للبحث</p>
      </div>
    );
  }

  const activeOwner = owners.find((o) => o.id === openMenu?.id) ?? null;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {owners.map((owner) => (
          <OwnerCard
            key={owner.id}
            owner={owner}
            onView={      () => onView(owner)}
            onMenuOpen={  (rect) => setOpenMenu(openMenu?.id === owner.id ? null : { id: owner.id, rect })}
            isMenuOpen={  openMenu?.id === owner.id}
          />
        ))}
      </div>

      {/* القائمة عبر Portal */}
      {openMenu && activeOwner && (
        <ActionsMenu
          owner={activeOwner}
          anchorRect={openMenu.rect}
          onView={         () => { onView(activeOwner);         setOpenMenu(null); }}
          onEdit={         () => { onEdit(activeOwner);         setOpenMenu(null); }}
          onToggleStatus={ () => { onToggleStatus(activeOwner); setOpenMenu(null); }}
          onResetPass={    () => { onResetPass(activeOwner);    setOpenMenu(null); }}
          onLoginAs={      () => { onLoginAs(activeOwner);      setOpenMenu(null); }}
          onDelete={       () => { onDelete(activeOwner);       setOpenMenu(null); }}
          onClose={        () => setOpenMenu(null)}
        />
      )}
    </>
  );
}