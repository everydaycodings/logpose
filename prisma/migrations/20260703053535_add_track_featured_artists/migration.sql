-- CreateTable
CREATE TABLE "_TrackFeaturedArtists" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TrackFeaturedArtists_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_TrackFeaturedArtists_B_index" ON "_TrackFeaturedArtists"("B");

-- AddForeignKey
ALTER TABLE "_TrackFeaturedArtists" ADD CONSTRAINT "_TrackFeaturedArtists_A_fkey" FOREIGN KEY ("A") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TrackFeaturedArtists" ADD CONSTRAINT "_TrackFeaturedArtists_B_fkey" FOREIGN KEY ("B") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;
