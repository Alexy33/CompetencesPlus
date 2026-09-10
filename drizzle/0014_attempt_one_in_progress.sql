-- Deduplication AVANT la creation de l'index.
--
-- L'index unique echouerait sur une base portant deja deux tentatives en
-- cours pour un meme candidat — et les migrations sont rejouees au demarrage
-- (src/instrumentation.ts), donc l'application ne demarrerait plus.
--
-- On conserve, par candidat, la tentative en cours la PLUS AVANCEE : celle qui
-- porte le plus de reponses, puis la plus recente. Les autres sont supprimees ;
-- leurs reponses partent avec elles (ON DELETE CASCADE). C'est le seul choix
-- qui ne fasse perdre a personne le travail deja fourni.
--
-- Sans doublon, cette requete ne supprime rien.
DELETE FROM `certification_attempt`
WHERE `id` IN (
  SELECT `id` FROM (
    SELECT
      a.`id`,
      ROW_NUMBER() OVER (
        PARTITION BY a.`user_id`
        ORDER BY
          (SELECT COUNT(*) FROM `certification_answer` x WHERE x.`attempt_id` = a.`id`) DESC,
          a.`created_at` DESC,
          a.`id` DESC
      ) AS rn
    FROM `certification_attempt` a
    WHERE a.`status` = 'in_progress'
  )
  WHERE rn > 1
);
--> statement-breakpoint
CREATE UNIQUE INDEX `certification_attempt_one_in_progress` ON `certification_attempt` (`user_id`) WHERE "certification_attempt"."status" = 'in_progress';
