DROP VIEW IF EXISTS quiz_correction_status;

CREATE VIEW quiz_correction_status AS
SELECT
    q.id AS quiz_id,
    q.module_id,
    qa.id AS attempt_id,
    qa.user_id,
    qa.score,
    qa.status,
    qa.completed_at,
    qa.corrected_by,
    qa.corrected_at,
    COUNT(ans.id) AS total_answers,
    COUNT(ans.id) FILTER (WHERE ans.is_corrected = true) AS corrected_answers,
    CASE
        WHEN COUNT(ans.id) = 0 THEN 'not_started'
        WHEN COUNT(ans.id) FILTER (WHERE ans.is_corrected = true) = COUNT(ans.id)
            THEN 'corrected'
        ELSE 'pending'
    END AS correction_status
FROM quizzes q
LEFT JOIN quiz_attempts qa
    ON qa.quiz_id = q.id
LEFT JOIN quiz_answers ans
    ON ans.attempt_id = qa.id
GROUP BY
    q.id,
    q.module_id,
    qa.id,
    qa.user_id,
    qa.score,
    qa.status,
    qa.completed_at,
    qa.corrected_by,
    qa.corrected_at;