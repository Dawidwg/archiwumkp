<!doctype html>
<html lang="en">
  <head>
    <title>Archiwum KP - Edycje</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">
    <link rel="stylesheet" href="css/bootstrap.min.css">
    <link rel="stylesheet" href="style1.css">
  </head>
  <body>
      <?php
         include("nav.php");
      ?>

      <section>
      <div id="tabela">
        <?php
          include("conn.php");
          $query = "SELECT id,nazwa FROM edycje ORDER BY id DESC";
          $result = mysqli_query($conn,$query);
          $query2 = "SELECT edycje.id AS 'ed', panstwa.nazwa AS 'kraj', uczestnicy.nick AS 'nick', piosenki.utwor AS 'pios' FROM piosenkaudzial JOIN edycje ON edycje.id=piosenkaudzial.idedycji JOIN panstwa ON panstwa.id=piosenkaudzial.idpanstwa JOIN piosenki ON piosenki.id=piosenkaudzial.idpiosenki JOIN uczestnicy ON uczestnicy.id=piosenkaudzial.iduczestnika WHERE wygrana=1 ORDER BY edycje.id";
          $result2 = mysqli_query($conn,$query2);
       
          echo "<table><th colspan=2>Edycja</th><th colspan=5>Zwycięzca</th>";
          foreach($result as $row)
          { 
             echo "<tr><td style='text-align:center; font-weight:bold;'>" . '<a href="edycje_szczegoly.php?id='.$row['id'].'">' . $row["id"] . "</a></td><td>" . '<a href="edycje_szczegoly.php?id='.$row['id'].'">' . $row["nazwa"] . "</a>" . "</td>";
             foreach($result2 AS $row2)
             {
               if($row['id']==$row2['ed'] && $row2['wygrana']=TRUE)
               {
                 echo '<td class="yt"><a href="https://www.youtube.com/results?search_query=' . str_replace('&', '', $row2['pios']) . '" target="_blank"><img src="img/yt.png"></a></td>';
                 echo "<td>" . $row2['pios'];
                 echo '</td><td class="px200">' . '<img width=20px src="img/flags/' . $row2['kraj'] . '.png" alt=""> ' . $row2['kraj'];
                 echo '</td><td class="px200">' . $row2['nick'];
               }
             }
             echo "</td></tr>";
          }
          echo "</table>";
        ?>
      </div>
      </section>

      <?php
         include("footer.php");
      ?>

    <script src="https://code.jquery.com/jquery-3.3.1.slim.min.js" integrity="sha384-q8i/X+965DzO0rT7abK41JStQIAqVgRVzpbzo5smXKp4YfRvH+8abtTE1Pi6jizo" crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js" integrity="sha384-UO2eT0CpHqdSJQ6hJty5KVphtPhzWj9WO1clHTMGa3JDZwrnQq4sF86dIHNDz0W1" crossorigin="anonymous"></script>
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js" integrity="sha384-JjSmVgyd0p3pXB1rRibZUAYoIIy6OrQ6VrjIEaFf/nJGzIxFDsf4x0xIM+B07jRM" crossorigin="anonymous"></script>
    <script src="js/bootstrap.min.js"></script>
  </body>
</html>