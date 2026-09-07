-- La reponse d'un candidat designe desormais l'OPTION choisie
-- (certification/questions.vN.json), et non plus les points qu'elle rapporte.
-- Le bareme appartient au questionnaire : le stocker dans la reponse rendait
-- celle-ci ininterpretable des que les points changeaient.
--
-- Les lignes existantes contiennent des points, pas des identifiants. Elles ne
-- sont PAS convertibles de facon fiable : rien ne garantit qu'une valeur
-- corresponde a une seule option. Les tentatives EN COURS concernees sont donc
-- videes de leurs reponses — le candidat repond a nouveau, sans rien perdre
-- d'acquis. Les tentatives SOUMISES conservent leur score et leur version :
-- il est deja calcule et stocke sur la tentative et le profil.
PRAGMA foreign_keys=OFF;--> statement-breakpoint
DELETE FROM `certification_answer`;--> statement-breakpoint
CREATE TABLE `__new_certification_answer` (
	`attempt_id` text NOT NULL,
	`question_id` text NOT NULL,
	`option_id` text NOT NULL,
	PRIMARY KEY(`attempt_id`, `question_id`),
	FOREIGN KEY (`attempt_id`) REFERENCES `certification_attempt`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
DROP TABLE `certification_answer`;--> statement-breakpoint
ALTER TABLE `__new_certification_answer` RENAME TO `certification_answer`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
