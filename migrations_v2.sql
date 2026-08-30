-- ============================================================
-- SmartCell v2 Migration — Standalone Quizzes & Essay Grading
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Make quizzes.module_id nullable for standalone quizzes
ALTER TABLE quizzes ALTER COLUMN module_id DROP NOT NULL;

-- 2. Add standalone quiz fields
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 3. Enhance quiz_attempts for essay grading workflow
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';
-- status values: 'completed' (all MC), 'in_grading' (has pending essays), 'graded' (all done)
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS mc_score NUMERIC DEFAULT 0;
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS essay_score NUMERIC DEFAULT 0;
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS total_score NUMERIC DEFAULT 0;
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT now();

-- 4. Enhance quiz_answers for per-question tracking
ALTER TABLE quiz_answers ADD COLUMN IF NOT EXISTS question_index INTEGER;
ALTER TABLE quiz_answers ADD COLUMN IF NOT EXISTS question_type TEXT DEFAULT 'mc';
-- question_type: 'mc' | 'essay'
ALTER TABLE quiz_answers ADD COLUMN IF NOT EXISTS max_points NUMERIC DEFAULT 0;

-- 5. Update the correction status view
DROP VIEW IF EXISTS quiz_correction_status;

CREATE VIEW quiz_correction_status AS
SELECT
    q.id AS quiz_id,
    q.module_id,
    q.title AS quiz_title,
    qa.id AS attempt_id,
    qa.user_id,
    qa.mc_score,
    qa.essay_score,
    qa.total_score,
    qa.status,
    qa.submitted_at,
    qa.corrected_by,
    qa.corrected_at,
    COUNT(ans.id) FILTER (WHERE ans.question_type = 'essay') AS total_essays,
    COUNT(ans.id) FILTER (WHERE ans.question_type = 'essay' AND ans.is_corrected = true) AS corrected_essays,
    COUNT(ans.id) FILTER (WHERE ans.question_type = 'essay' AND ans.is_corrected = false) AS pending_essays
FROM quizzes q
LEFT JOIN quiz_attempts qa ON qa.quiz_id = q.id
LEFT JOIN quiz_answers ans ON ans.attempt_id = qa.id
GROUP BY
    q.id, q.module_id, q.title,
    qa.id, qa.user_id, qa.mc_score, qa.essay_score, qa.total_score,
    qa.status, qa.submitted_at, qa.corrected_by, qa.corrected_at;
