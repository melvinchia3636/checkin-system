import { Icon } from "@iconify/react/dist/iconify.js";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { firestore } from "./firebase.config";

function getChineseClassName(classId: string) {
  const seniorOrJunior = classId.startsWith("S") ? "高" : "初";
  const grade = ["一", "二", "三"][parseInt(classId.slice(1, 2)) - 1];
  let stream = "";
  if (seniorOrJunior === "高") {
    switch (classId.slice(2, 3)) {
      case "S":
        stream = "理";
        break;
      case "A":
        stream = "文商";
        break;
      case "C":
        stream = "商";
        break;
    }
  }

  const classNumber =
    seniorOrJunior === "高"
      ? classId.match(/.+(\d+)$/)?.[1]
      : classId.slice(2, 4);

  return `${seniorOrJunior}${grade}${stream}${parseInt(classNumber || "")}`;
}

function App() {
  const [conn, setConn] = useState<Socket>();
  const [result, setResult] = useState("");
  const [result2, setResult2] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const socket = io("http://localhost:8000");

    setConn(socket);

    socket.on("message", async (data) => {
      if (data === "not_found") {
        setResult("找不到学生");
        setResult2("Student Not Found");
      }

      if (data === "error") {
        setResult("出现错误，请在试多一次");
        setResult2("Error, please try again");
      }

      if (data.startsWith("found:")) {
        setLoading(true);
        const [_, id] = data.split(":");
        const q = query(
          collection(firestore, "students"),
          where("fingerprint", "==", id)
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setResult("找不到学生");
          setResult2("Student Not Found");
        } else {
          const data = querySnapshot.docs[0].data();

          const existedAttendanceRecordQuery = query(
            collection(firestore, "attendance_raw_record"),
            where("studentId", "==", querySnapshot.docs[0].id),
            where("date", "==", new Date().toLocaleDateString())
          );

          const existedAttendanceRecordQuerySnapshot = await getDocs(
            existedAttendanceRecordQuery
          );

          if (existedAttendanceRecordQuerySnapshot.empty) {
            await addDoc(collection(firestore, "attendance_raw_record"), {
              studentId: querySnapshot.docs[0].id,
              date: new Date().toLocaleDateString(),
              time: new Date().toLocaleTimeString(),
            });

            setResult("签到成功 Checked In Successfully");
            setResult2(
              `${querySnapshot.docs[0].id} ${getChineseClassName(data.class)} ${
                data.name_ch
              } ${data.name_en}`
            );
          } else {
            setResult("已签到");
            setResult2("Already Checked In");
          }
        }

        setLoading(false);
      }

      setTimeout(() => {
        setIsSearching(false);
      }, 2000);
    });

    return () => {
      socket.disconnect();
      setConn(undefined);
    };
  }, []);

  function searchFingerprint() {
    if (conn) {
      console.log("Search");
      conn.emit("searchFingerprint");
    }
  }

  useEffect(() => {
    setTimeout(() => {
      if (!isSearching && conn) {
        setResult("");
        setIsSearching(true);
        searchFingerprint();
      }
    }, 1000);
  }, [isSearching, conn]);

  return (
    <main className="w-full h-screen bg-zinc-900 text-zinc-100 flex flex-col items-center justify-center">
      {loading ? (
        <Icon icon="svg-spinners:180-ring" className="text-5xl" />
      ) : !result ? (
        <>
          <Icon icon="tabler:fingerprint" className="text-9xl mb-8" />
          <p className="mb-8 text-5xl font-medium tracking-wide">
            请将手指放在感应器上
          </p>
          <p className="text-4xl tracking-wide">
            Please place your finger on the sensor
          </p>
        </>
      ) : (
        <>
          <Icon
            icon={
              result.startsWith("签到成功")
                ? "tabler:circle-check"
                : result.startsWith("已签到")
                ? "tabler:exclamation-circle"
                : "tabler:circle-x"
            }
            className="text-9xl mb-8"
          />
          <p className="text-5xl font-medium tracking-wide mb-8">{result}</p>
          <p className="text-4xl tracking-wide">{result2}</p>
        </>
      )}
    </main>
  );
}

export default App;
