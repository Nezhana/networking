USE videoconference;
-- create
-- CREATE TABLE USER (
--   ID INT AUTO_INCREMENT PRIMARY KEY,
--   name CHAR(40) DEFAULT NULL
-- );

-- insert
-- INSERT INTO USER VALUES ();
-- INSERT INTO USER (name) VALUES ('Nolan');
-- INSERT INTO USER VALUES ();

-- fetch 
SELECT * FROM USER;
SELECT ID AS 'NULL NAME ID' FROM USER WHERE name IS NULL;

-- update
-- UPDATE USER
-- SET name = 'user_1'
-- WHERE ID = 1;

-- UPDATE USER
-- SET name = 'user_3'
-- WHERE ID = 3;

-- fetch 
SELECT * FROM USER;

-- ------------------------------------------

-- create
-- CREATE TABLE ROOM (
--     ID INT AUTO_INCREMENT PRIMARY KEY,
--     name VARCHAR(50) NOT NULL,
--     link VARCHAR(100) NOT NULL
-- );

-- insert
-- INSERT INTO ROOM (name, link) VALUES ('Room 1', 'htt//www.videoconference.ua/link/562c88ab-9f9a-4b9d-8ae8-87884d23c393');
-- INSERT INTO ROOM (name, link) VALUES ('Room 2', 'htt//www.videoconference.ua/link/c7620a83-e279-4e0f-8a3d-adebc5cfb1d7');
-- INSERT INTO ROOM (name, link) VALUES ('Room 3', 'htt//www.videoconference.ua/link/01a38da3-630e-4418-9067-37b5a847d679');

-- fetch 
SELECT * FROM ROOM;


-- ------------------------------------------

-- create
-- CREATE TABLE SAVED_ROOM (
--     ID INT AUTO_INCREMENT PRIMARY KEY,
--     user_ID INT,
--     room_ID INT,
--     FOREIGN KEY (user_ID) REFERENCES USER(ID),
--     FOREIGN KEY (room_ID) REFERENCES ROOM(ID)
-- );

-- insert
-- INSERT INTO SAVED_ROOM (user_ID, room_ID) VALUES (1, 2);
-- INSERT INTO SAVED_ROOM (user_ID, room_ID) VALUES (2, 3);
-- INSERT INTO SAVED_ROOM (user_ID, room_ID) VALUES (3, 1);

-- fetch 
SELECT * FROM SAVED_ROOM;
SELECT SAVED_ROOM.ID, SAVED_ROOM.user_ID, SAVED_ROOM.room_ID, ROOM.name, ROOM.link
FROM SAVED_ROOM
LEFT JOIN ROOM ON SAVED_ROOM.room_ID = ROOM.ID
ORDER BY SAVED_ROOM.ID;