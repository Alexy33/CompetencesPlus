-- Marque explicitement une tentative de rattrapage (mise a jour de
-- certification apres publication d'une nouvelle version du questionnaire).
-- Les tentatives existantes sont des passations ordinaires : false.
ALTER TABLE `certification_attempt` ADD `catch_up` integer DEFAULT false NOT NULL;
