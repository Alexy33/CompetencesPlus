-- La video n'est plus designee par une URL (donc, pour un depot direct, par un
-- chemin devinable) mais par un identifiant OPAQUE et le nom de son hebergeur.
-- Les octets, eux, sont deplaces par `npm run video:migrate`, qui sait relire
-- les identifiants poses ici.

ALTER TABLE `profile` ADD `video_id` text;--> statement-breakpoint
ALTER TABLE `profile` ADD `video_provider` text;--> statement-breakpoint

-- Depot direct : `/api/videos/{profileId}`. On attribue un identifiant opaque
-- tire au sort ; le script de migration retrouve le fichier par le profil et
-- le range sous ce nouvel identifiant.
UPDATE `profile`
SET `video_provider` = 'local',
    `video_id` = lower(hex(randomblob(16)))
WHERE `video_url` LIKE '/api/videos/%'
  AND `video_id` IS NULL;--> statement-breakpoint

-- Lien YouTube / Vimeo : aucun octet chez nous, l'URL EST la reference. Ce
-- fournisseur reste eteint par defaut (VIDEO_EMBED_ENABLED), les fiches
-- concernees affichent donc le message d'indisponibilite tant qu'il l'est.
UPDATE `profile`
SET `video_provider` = 'embed',
    `video_id` = `video_url`
WHERE `video_url` IS NOT NULL
  AND `video_url` NOT LIKE '/api/videos/%'
  AND `video_id` IS NULL;--> statement-breakpoint

ALTER TABLE `profile` DROP COLUMN `video_url`;--> statement-breakpoint
CREATE INDEX `profile_video_id_idx` ON `profile` (`video_id`);
